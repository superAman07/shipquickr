import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId, role: "admin" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: admin }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admin profile" }, { status: 500 });
  }
}