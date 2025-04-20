import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = parseInt(params.userId);
    const kyc = await prisma.kycDetail.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });
    if (!kyc) return NextResponse.json({ error: "KYC not found" }, { status: 404 });
    return NextResponse.json({ kyc });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}