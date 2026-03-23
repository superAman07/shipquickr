import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let banner = await prisma.globalBanner.findFirst();
    if (!banner) {
      banner = await prisma.globalBanner.create({
        data: { content: "System Update", isActive: false }
      });
    }
    return NextResponse.json(banner);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    let banner = await prisma.globalBanner.findFirst();
    if (banner) {
      banner = await prisma.globalBanner.update({
        where: { id: banner.id },
        data: {
          content: data.content,
          backgroundColor: data.backgroundColor,
          isActive: data.isActive
        }
      });
    } else {
      banner = await prisma.globalBanner.create({ data });
    }
    return NextResponse.json(banner);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
