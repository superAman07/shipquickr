import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPhonePeAccessToken } from "@/lib/services/phonepe-auth";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { merchantOrderId } = await req.json();

    if (!merchantOrderId) {
      return NextResponse.json({ error: "merchantOrderId is required" }, { status: 400 });
    }

    // Check if already Success — avoid double credit
    const existingTx = await prisma.transaction.findUnique({
      where: { merchantTransactionId: merchantOrderId },
    });

    if (!existingTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existingTx.status === "Success") {
      // Already credited — just return success
      return NextResponse.json({ success: true, alreadyCredited: true });
    }

    // Ask PhonePe for the real payment status
    const accessToken = await getPhonePeAccessToken();

    const statusRes = await axios.get(
      `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const orderData = statusRes.data;
    console.log("PhonePe Order Status Response:", JSON.stringify(orderData, null, 2));

    const state = orderData?.state; // "COMPLETED" | "FAILED" | "PENDING"
    const providerReferenceId = orderData?.paymentDetails?.[0]?.transactionId || null;

    if (state === "COMPLETED") {
      // Credit wallet atomically
      await prisma.$transaction(async (tx) => {
        await tx.wallet.upsert({
          where: { userId: existingTx.userId },
          update: { balance: { increment: existingTx.amount } },
          create: { userId: existingTx.userId, balance: existingTx.amount },
        });

        await tx.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: "Success",
            providerReferenceId: providerReferenceId,
            remarks: "Wallet recharge successful via PhonePe.",
          },
        });
      });

      return NextResponse.json({ success: true, credited: true });
    } else if (state === "FAILED" || state === "CANCELLED") {
      await prisma.transaction.update({
        where: { id: existingTx.id },
        data: {
          status: "Failed",
          providerReferenceId: providerReferenceId,
          remarks: `Payment ${state.toLowerCase()} on PhonePe.`,
        },
      });
      return NextResponse.json({ success: false, state });
    } else {
      // PENDING — webhook will handle it later
      return NextResponse.json({ success: false, state: "PENDING" });
    }
  } catch (err: any) {
    console.error("Verify Payment Error:", err?.response?.data || err.message);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
