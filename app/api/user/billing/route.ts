import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client'; 

interface TokenDetailsType {
  userId: string;
  exp: number;
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

    if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const userId = parseInt(decoded.userId);
    if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID in token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where: Prisma.TransactionWhereInput = {
      userId: userId,
    };

    // --- Fixed Date Filtering ---
    const createdAtFilter: Prisma.DateTimeFilter = {};
    let addDateFilter = false;

    if (startDateStr) {
        try {
            createdAtFilter.gte = new Date(startDateStr);
            addDateFilter = true;
        } catch (e) { /* Ignore invalid date */ }
    }
    if (endDateStr) {
        try {
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);  
            createdAtFilter.lte = endDate;
            addDateFilter = true;
        } catch (e) { /* Ignore invalid date */ }
    }

    if (addDateFilter) {
        where.createdAt = createdAtFilter;
    }
    // --- End Fixed Date Filtering ---


    if (search) {
      where.OR = [
        { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
        { razorpayOrderId: { contains: search, mode: 'insensitive' } },
        { order: { awbNumber: { contains: search, mode: 'insensitive' } } },
      ];
       const searchAsInt = parseInt(search);
       if (!isNaN(searchAsInt)) {
           where.OR.push({ id: searchAsInt });
       }
    }

    const [transactions, totalCount, wallet] = await Promise.all([
        prisma.transaction.findMany({
            where: where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                order: {
                    select: {
                        awbNumber: true,
                        courierName: true,
                        billableWeight: true,
                        status: true,
                        remarks: true,
                        orderId: true,
                    },
                },
            },
        }),
        prisma.transaction.count({ where: where }),
        prisma.wallet.findUnique({
            where: { userId: userId },
            select: { balance: true },
        })
    ]);


    const rechargeLogs = transactions
      .filter((tx) => tx.type === "recharge" || tx.type === "credit")
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
      .filter((tx) => tx.type === "debit" && tx.orderId)
      .map((tx) => ({
        id: tx.id,
        date: tx.createdAt,
        courierName: tx.order?.courierName ?? "N/A",
        amount: tx.amount,
        waybill: tx.order?.awbNumber ?? "N/A",
        orderId: tx.order?.orderId ?? tx.orderId,
        transactionId: tx.id,
        type: tx.type,
        weight: tx.order?.billableWeight ?? "N/A",
        zone: "N/A", 
        status: tx.status ?? tx.order?.status ?? "Processed",
        remarks: tx.order?.remarks ?? "-",
      }));


    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      rechargeLogs,
      shippingCharges,
      totalCount: totalCount,
      currentPage: page,
      pageSize: pageSize,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching billing data:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ error: "Database error occurred." }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}