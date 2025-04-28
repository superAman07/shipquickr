import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma"; 

// bacha hua kaam 
// Razorpay Dashboard Setting
// Webhook URL: https://yourdomain.com/api/user/wallet/webhook
// Events: payment.captured (minimum)


export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
 
    if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const userId = Number(payment.notes.userId);
        const amount = payment.amount / 100;
       
        await prisma.wallet.upsert({
          where: { userId },
          update: { balance: { increment: amount } },
          create: { userId, balance: amount },
        });
       
        await prisma.transaction.create({
          data: {
            userId,
            amount,
            type: "recharge",
            status: "Success",
            razorpayPaymentId: payment.id, 
            razorpayOrderId: payment.order_id,
          },
        });
      }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}