import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { getPhonePeAccessToken } from "@/lib/services/phonepe-auth";

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
    console.log("token:", token);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    console.log("decoded token:", decoded);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const { amount } = await req.json();
    console.log("amount:", amount);
    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const merchantTransactionId = `MUID${decoded.userId}${Date.now()}`;

    const temp = await prisma.transaction.create({
      data: {
        userId: parseInt(decoded.userId),
        amount: Number(amount),
        type: "recharge",
        status: "Pending",
        merchantTransactionId, 
      },
    });
    console.log("prisma record:", temp);

    // const accessToken = await getPhonePeAccessToken();
    // console.log("phonepe accessToken:", accessToken);

    const phonepePayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID!,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: String(decoded.userId),
      name: decoded.firstName + " " + decoded.lastName,
      amount:(amount * 100),
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/wallet`,
      redirectMode: "REDIRECT",
      callbackUrl: process.env.PHONEPE_CALLBACK_URL!, 
      mobileNumber: decoded.mobile || "",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    console.log("Phone pe payload: ", phonepePayload);

    const payload = JSON.stringify(phonepePayload);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + process.env.PHONEPE_CLIENT_SECRET!;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
    const uat_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const final_URL = process.env.NODE_ENV === 'production' ? prod_URL : uat_URL;
    const options = {
      method: "POST",
      url: final_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    console.log("Options after payload:", options);

    const phonepeRes = await axios(options);
    console.log("PhonePe API response:", phonepeRes.data);

    const redirectUrl = phonepeRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    console.log("Redirect URL:", redirectUrl);

    if (!redirectUrl) {
      return NextResponse.json({ error: "Failed to get PhonePe redirect URL" }, { status: 500 });
    }

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err: any) {
    console.error("error:", err.response?.data || err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

interface TokenDetailsType {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  exp: number;
  mobile?: string;
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
