import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface TokenDetailsType { userId: number; exp: number; }

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

    const { webhookUrl } = await req.json();

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { webhookUrl: webhookUrl || null }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving webhook:", error);
    return NextResponse.json({ error: "Failed to save webhook" }, { status: 500 });
  }
}
