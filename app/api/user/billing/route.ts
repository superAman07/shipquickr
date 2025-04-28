import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";

interface TokenDetailsType {
  userId: string;  
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: TokenDetailsType;
    try {
      decoded = jwtDecode<TokenDetailsType>(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = parseInt(decoded.userId); 
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId },
      select: { balance: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            awbNumber: true,
            courierName: true,
            billableWeight: true,
            status: true,
            remarks: true,
          },
        },
      },
    });
 
    const rechargeLogs = transactions
      .filter((tx) => tx.type === "credit")
      .map((tx) => ({
        id: tx.id,
        date: tx.createdAt,
        amount: tx.amount,
        transactionId: tx.id,  
        bankTransactionId: tx.razorpayPaymentId,
        type: tx.type,
        status: tx.status ?? "Unknown",  
      }));

    const shippingCharges = transactions
      .filter((tx) => tx.type === "debit" && tx.order)  
      .map((tx) => ({
        id: tx.id,
        date: tx.createdAt,
        courierName: tx.order?.courierName,
        amount: tx.amount,  
        waybill: tx.order?.awbNumber,
        transactionId: tx.id,  
        type: tx.type,
        weight: tx.order?.billableWeight,
        zone: "N/A", 
        status: tx.status ?? tx.order?.status ?? "Processed", 
        remarks: tx.order?.remarks,
      }));

    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      rechargeLogs,
      shippingCharges,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching billing data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}