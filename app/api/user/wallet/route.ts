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

    const merchantOrderId = `MUID${decoded.userId}${Date.now()}`;
    console.log("merchantOrderId:", merchantOrderId);

    const temp = await prisma.transaction.create({
      data: {
        userId: parseInt(decoded.userId),
        amount: Number(amount),
        type: "recharge",
        status: "Pending",
        merchantTransactionId: merchantOrderId,
      },
    });
    console.log("prisma record:", temp);

    const accessToken = await getPhonePeAccessToken();
    console.log("phonepe accessToken:", accessToken);

    const payload = {
      merchantOrderId,
      amount: Math.round(amount * 100),
      expireAfter: 1200,
      metaInfo: {
        udf1: String(decoded.userId),
        udf2: decoded.email,
        udf3: "",
        udf4: "",
        udf5: "",
      },
      paymentFlow: { type: "PG_CHECKOUT" },
    };
    console.log("payload object:", payload);

    const apiPath = "/checkout/v2/sdk/order";
    const jsonBody = JSON.stringify(payload);
    console.log("jsonBody:", jsonBody);

    const salt = process.env.PHONEPE_CLIENT_SECRET!;
    const toSign = jsonBody + apiPath + salt;
    const signature = crypto.createHash("sha256").update(toSign).digest("hex");
    const checksum = `${signature}###1`;
    console.log("checksum:", checksum);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-CLIENT-ID": process.env.PHONEPE_CLIENT_ID!,
      "Authorization": `O-Bearer ${accessToken}`,
    };
    if (process.env.PHONEPE_CALLBACK_URL) {
      headers["X-CALLBACK-URL"] = process.env.PHONEPE_CALLBACK_URL;
    }
    console.log("request headers:", headers);

    const resp = await fetch(
      `https://api.phonepe.com/apis/pg${apiPath}`,
      {
        method: "POST",
        headers,
        body: jsonBody,
      }
    );
    const data = await resp.json();
    console.log("http status:", resp.status, "response data:", data);

    if (!resp.ok) throw new Error(JSON.stringify(data));

    // PhonePe returns { orderId, state, expireAt, token }
    console.log("order token:", data.token);
    return NextResponse.json({ success: true, orderToken: data.token , orderId: data.orderId,});
  } catch (err: any) {
    console.error("error:", err);
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
