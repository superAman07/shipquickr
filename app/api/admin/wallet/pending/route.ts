import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { getPhonePeAccessToken } from "@/lib/services/phonepe-auth";
import axios from "axios";

interface AdminToken {
  userId: string;
  role: string;
  exp: number;
}

function isAdminAuth(token: string | undefined) {
  if (!token) return false;
  try {
    const decoded = jwtDecode<AdminToken>(token);
    return decoded.role === "admin" && decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// GET — list all Pending recharge transactions with user info
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken")?.value;
  if (!isAdminAuth(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.transaction.findMany({
    where: { type: "recharge", status: "Pending" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return NextResponse.json({ transactions: pending });
}

// POST — verify a single pending transaction against PhonePe and credit if successful
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken")?.value;
  if (!isAdminAuth(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { merchantTransactionId } = await req.json();
  if (!merchantTransactionId) {
    return NextResponse.json({ error: "merchantTransactionId required" }, { status: 400 });
  }

  const tx = await prisma.transaction.findUnique({
    where: { merchantTransactionId },
  });

  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (tx.status === "Success") {
    return NextResponse.json({ success: true, alreadyCredited: true, message: "Already credited" });
  }

  // Check PhonePe
  const accessToken = await getPhonePeAccessToken();
  const statusRes = await axios.get(
    `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantTransactionId}/status`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
    }
  );

  const orderData = statusRes.data;
  const state = orderData?.state; // "COMPLETED" | "FAILED" | "PENDING"
  const providerReferenceId = orderData?.paymentDetails?.[0]?.transactionId || null;

  if (state === "COMPLETED") {
    await prisma.$transaction(async (db) => {
      await db.wallet.upsert({
        where: { userId: tx.userId },
        update: { balance: { increment: tx.amount } },
        create: { userId: tx.userId, balance: tx.amount },
      });
      await db.transaction.update({
        where: { id: tx.id },
        data: {
          status: "Success",
          providerReferenceId,
          remarks: "Wallet recharge verified & credited by Admin.",
        },
      });
    });
    return NextResponse.json({ success: true, credited: true, message: `₹${tx.amount} credited successfully` });
  } else if (state === "FAILED" || state === "CANCELLED") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "Failed", providerReferenceId, remarks: `Payment ${state} on PhonePe.` },
    });
    return NextResponse.json({ success: false, state, message: `Payment ${state} on PhonePe` });
  } else {
    return NextResponse.json({ success: false, state: "PENDING", message: "Payment still pending on PhonePe" });
  }
}
