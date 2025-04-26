import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.pathname.split("/").pop(); 
    if (!userId) return NextResponse.json({ error: "UserId missing" }, { status: 400 });

    const kyc = await prisma.kycDetail.findUnique({
      where: { userId: parseInt(userId) },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });
    if (!kyc) return NextResponse.json({ error: "KYC not found" }, { status: 404 });
    return NextResponse.json({ kyc });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}