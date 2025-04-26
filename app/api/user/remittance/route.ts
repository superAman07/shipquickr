import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
 
function getUserIdFromToken() {
  
}

export async function GET(req: NextRequest) { 
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken")?.value;
  if (!token) return null; 
  const decoded = jwtDecode<{ userId: number }>(token);
  const userId = decoded.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "remittance";
  const search = searchParams.get("search")?.trim() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const dateRange = searchParams.get("daterange") || "";
 
  let where: any = { userId };
  if (tab === "netoff") {
    where.OR = [
      { netOffAmount: { gt: 0 } },
      { earlyCodCharge: { gt: 0 } },
      { otherDeductions: { gt: 0 } },
    ];
  }
  if (search) {
    where.OR = [
      ...(where.OR || []),
      { utrReference: { contains: search, mode: "insensitive" } },
      { remarks: { contains: search, mode: "insensitive" } },
    ];
  }
  if (dateRange) {
    const [from, to] = dateRange.split(" - ");
    if (from && to) {
      where.remittanceDate = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
  }
 
  const skip = (page - 1) * pageSize;
  const take = pageSize;
 
  const [total, remittances] = await Promise.all([
    prisma.remittance.count({ where }),
    prisma.remittance.findMany({
      where,
      orderBy: { remittanceDate: "desc" },
      skip,
      take,
      include: {
        orders: true, 
      },
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

  return NextResponse.json({
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
  });
}