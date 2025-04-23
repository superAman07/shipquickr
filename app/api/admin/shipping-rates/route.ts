import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rates);
}
 
export async function POST(req: NextRequest) {
  const data = await req.json();
  const rates = await prisma.shippingRates.upsert({
    where: { id: 1 }, 
    update: data,
    create: data,
  });
  return NextResponse.json(rates);
}