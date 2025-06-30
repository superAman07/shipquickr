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

    const accessToken = await getPhonePeAccessToken();

    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: Math.round(amount * 100),
      expireAfter: 1200,
      metaInfo: {
        udf1: decoded.userId,
        udf2: decoded.email,
        udf3: "",
        udf4: "",
        udf5: ""
      },
      paymentFlow: {
        type: "PG_CHECKOUT"
        // Optionally add paymentModeConfig here if we want to restrict payment modes
      }
    };

    const apiPath = "/checkout/v2/sdk/order";
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const salt = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = 1;
    const stringToHash = base64Payload + apiPath + salt;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    const baseUrl = process.env.NODE_ENV === "production" ? "https://api.phonepe.com/apis/pg" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const response = await axios.post(
      `${baseUrl}/checkout/v2/sdk/order`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "Authorization": `O-Bearer ${accessToken}`,
        },
      }
    );

    const paymentUrl = response.data.data?.instrumentResponse?.redirectInfo?.url || response.data.data?.redirectUrl;
    return NextResponse.json({ success: true, paymentUrl });

  } catch (err: any) {
    if (err.response) {
      console.error("PhonePe API error:", err.response.data);
    } else {
      console.error("PhonePe order error:", err);
    }
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
