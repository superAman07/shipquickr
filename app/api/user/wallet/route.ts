import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

interface TokenDetailsType {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const merchantTransactionId = `MUID${decoded.userId}${Date.now()}`;
    const merchantUserId = `CUID${decoded.userId}`;

    await prisma.transaction.create({
      data: {
        userId: parseInt(decoded.userId),
        amount: Number(amount),
        type: "recharge",
        status: "Pending",
        merchantTransactionId: merchantTransactionId,
      },
    });

    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: Math.round(amount * 100), // Amount in paise
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/wallet?status=success`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/user/wallet/webhook`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const salt = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = 1;
    const stringToHash = base64Payload + "/pg/v1/pay" + salt;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    const response = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    const paymentUrl = response.data.data.instrumentResponse.redirectInfo.url;
    return NextResponse.json({ success: true, paymentUrl });

  } catch (err) {
    console.error("Phonepe order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

interface TokenDetailsType {
  userId: string;
  exp: number;
}

export async function GET() {
  try {
    const cookiesStores = await cookies();
    const token = cookiesStores.get('userToken')?.value;
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }
    const decoded = jwtDecode<TokenDetailsType>(token)
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    const userId = decoded.userId;
    const wallet = await prisma.wallet.findUnique({ where: { userId: parseInt(userId) } })

    const transactions = await prisma.transaction.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ balance: wallet?.balance || 0, transactions });

  } catch (err) {
    console.error("Error fetching wallet data:", err);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
