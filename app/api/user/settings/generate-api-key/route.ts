import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import crypto from "crypto";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Generate a secure 64-character hex string
    const newApiKey = "sk_live_" + crypto.randomBytes(32).toString('hex');

    // Save to the user's database record
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { merchantApiKey: newApiKey },
      select: { merchantApiKey: true }
    });

    return NextResponse.json({ 
      success: true, 
      apiKey: updatedUser.merchantApiKey 
    }, { status: 200 });

  } catch (error) {
    console.error("Error generating API key:", error);
    return NextResponse.json({ error: "Failed to generate API Key" }, { status: 500 });
  }
}