import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TokenDetailsType {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwtDecode<TokenDetailsType>(token);
    const userId = parseInt(decoded.userId);

    // Fetch Completed Remittances
    const history = await prisma.remittance.findMany({
      where: { userId },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate pending stats
    const pendingOrders = await prisma.order.findMany({
      where: {
        userId,
        paymentMode: { equals: "COD", mode: "insensitive" },
        status: "delivered",
        remittanceId: null,
      },
      select: {
        codAmount: true,
        shippingCost: true,
      },
    });

    let pendingCod = 0;
    let pendingFreight = 0;
    pendingOrders.forEach((o) => {
      pendingCod += o.codAmount || 0;
      pendingFreight += o.shippingCost || 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats: {
          pendingCod,
          pendingFreight,
          pendingPayable: pendingCod - pendingFreight,
          pendingCount: pendingOrders.length,
          totalRemitted: history.reduce((sum, item) => sum + item.codPaid, 0),
        },
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user remittance:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}