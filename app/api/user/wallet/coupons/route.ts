import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        status: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        code: true,
        condition: true,
        amount: true,
        amountType: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons." },
      { status: 500 }
    );
  }
}