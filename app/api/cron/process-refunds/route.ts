import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dueRefunds = await prisma.order.findMany({
    where: {
      refundStatus: "pending",
      refundDueDate: { lte: new Date() },
      refundAmount: { gt: 0 }
    }
  });
  let processed = 0;
  for (const order of dueRefunds) {
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: order.userId },
        data: { balance: { increment: order.refundAmount! } }
      });
      await tx.order.update({
        where: { id: order.id },
        data: { refundStatus: "processed" }
      });
      await tx.transaction.create({
        data: {
          userId: order.userId,
          amount: order.refundAmount!,
          type: "credit",
          status: "Success",
          orderId: order.id,
          remarks: `Refund processed for cancelled shipment (AWB: ${order.awbNumber})`
        }
      });
    });
    processed++;
  }
  return NextResponse.json({ success: true, processed, total: dueRefunds.length });
}