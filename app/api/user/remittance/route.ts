import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
    }

    const userId = decoded.userId;
 
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
 
    const [total, remittances] = await Promise.all([
      prisma.remittance.count({ where: { userId } }),
      prisma.remittance.findMany({
        where: { userId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { remittanceDate: "desc" },
        include: { orders: true },
      }),
    ]);

    const summary = await prisma.remittance.aggregate({
      _sum: {
        collectableValue: true,
        codPaid: true,
        netOffAmount: true,
        earlyCodCharge: true,
        otherDeductions: true,
      },
      where: { userId },
    });

    return new Response(
      JSON.stringify({
        total,
        page,
        pageSize,
        remittances,
        summary: {
          totalCOD: summary._sum.collectableValue || 0,
          codPaid: summary._sum.codPaid || 0,
          deduction:
            (summary._sum.netOffAmount || 0) +
            (summary._sum.earlyCodCharge || 0) +
            (summary._sum.otherDeductions || 0),
          codAvailable:
            (summary._sum.collectableValue || 0) -
            ((summary._sum.netOffAmount || 0) +
              (summary._sum.earlyCodCharge || 0) +
              (summary._sum.otherDeductions || 0) +
              (summary._sum.codPaid || 0)),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching remittance data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch remittance data" }), { status: 500 });
  }
}