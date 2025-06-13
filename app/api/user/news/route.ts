import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try { 
    const news = await prisma.news.findMany({
      where: { status: true },
      orderBy: { id: 'desc' }, 
      take: 5  
    });
    
    return NextResponse.json(news);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}