import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const userId = parseInt(userIdParam);
    if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid User ID format" }, { status: 400 });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { userId: userId },
      orderBy: { warehouseName: 'asc' }
    });
    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("Error fetching warehouses for admin:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}