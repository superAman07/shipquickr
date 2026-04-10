import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    const query = req.nextUrl.searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await prisma.order.findMany({
      where: {
        userId: decoded.userId,
        OR: [
          { orderId: { contains: query, mode: "insensitive" } },
          { awbNumber: { contains: query, mode: "insensitive" } },
          { customerName: { contains: query, mode: "insensitive" } },
          { mobile: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        orderId: true,
        awbNumber: true,
        customerName: true,
        status: true,
        paymentMode: true, 
        city: true,        
        createdAt: true,   
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}