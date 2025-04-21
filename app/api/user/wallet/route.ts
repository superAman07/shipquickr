import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
 
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),  
      currency: "INR",
      receipt: `wallet_${decoded.userId}_${Date.now()}`,
      payment_capture: true,
      notes: {
        userId: decoded.userId,
        email: decoded.email,
      },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

interface TokenDetailsType {
  userId: string;
  exp: number;
}

export async function GET(){
  try{
    const cookiesStores = await cookies();
    const token = cookiesStores.get('userToken')?.value;
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }
    const decoded = jwtDecode<TokenDetailsType>(token)
    if(decoded.exp *1000 < Date.now()){
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    const userId  = decoded.userId;
    const wallet = await prisma.wallet.findUnique({where:{userId:parseInt(userId)}})
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ balance: wallet?.balance || 0, transactions });

  }catch(err){
    console.error("Error fetching wallet data:", err);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
