import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import crypto from "crypto";

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY!;
const PHONEPE_SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX!, 10);

// Determine the host URL based on the environment
const hostUrl = process.env.NODE_ENV === 'production'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// This function checks the status of a single transaction with PhonePe
async function checkPhonePeStatus(merchantTransactionId: string) {
  const endpoint = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
  const xVerify = crypto.createHash('sha256').update(endpoint + PHONEPE_SALT_KEY).digest('hex') + '###' + PHONEPE_SALT_INDEX;

  try {
    const response = await axios.get(`${hostUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error checking status for ${merchantTransactionId}:`, error.response?.data || error.message);
    return null;
  }
}

export async function GET(req: NextRequest) { 
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_API_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log("Cron job: Starting reconciliation of pending payments...");
 
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: "Pending",
      createdAt: {
        lt: fifteenMinutesAgo,
      },
    },
  });

  if (pendingTransactions.length === 0) {
    console.log("Cron job: No pending transactions to reconcile.");
    return NextResponse.json({ message: "No pending transactions to reconcile." });
  }

  console.log(`Cron job: Found ${pendingTransactions.length} pending transactions to check.`);
  let successCount = 0;
  let failedCount = 0;

  // --- Process Each Pending Transaction ---
  for (const transaction of pendingTransactions) {
    if (!transaction.merchantTransactionId) {
      console.log(`Skipping transaction with missing merchantTransactionId.`);
      continue;
    }
    const phonepeResponse = await checkPhonePeStatus(transaction.merchantTransactionId);

    if (!phonepeResponse || !phonepeResponse.success) {
      console.log(`Skipping transaction ${transaction.merchantTransactionId}, could not fetch status.`);
      continue;
    }

    const status = phonepeResponse.code;
    const providerReferenceId = phonepeResponse.data?.providerReferenceId;

    // --- Update DB based on status (logic copied from webhook) ---
    if (status === 'PAYMENT_SUCCESS') {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId: transaction.userId },
            data: { balance: { increment: transaction.amount } },
          });
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "Success",
              providerReferenceId: providerReferenceId,
              remarks: "Reconciled by cron job."
            },
          });
        });
        successCount++;
        console.log(`Reconciled SUCCESS for ${transaction.merchantTransactionId}`);
      } catch (e) {
        console.error(`Error in DB transaction for SUCCESS reconciliation of ${transaction.merchantTransactionId}:`, e);
      }
    } else if (status === 'PAYMENT_ERROR' || status === 'PAYMENT_CANCELLED' || status === 'TIMED_OUT') {
      try {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "Failed",
            providerReferenceId: providerReferenceId,
            remarks: `Reconciled as Failed by cron job. Code: ${status}`
          },
        });
        failedCount++;
        console.log(`Reconciled FAILED for ${transaction.merchantTransactionId}`);
      } catch (e) {
        console.error(`Error in DB transaction for FAILED reconciliation of ${transaction.merchantTransactionId}:`, e);
      }
    }
  }

  const summary = `Reconciliation complete. Success: ${successCount}, Failed: ${failedCount}.`;
  console.log(`Cron job: ${summary}`);
  return NextResponse.json({ message: summary });
}