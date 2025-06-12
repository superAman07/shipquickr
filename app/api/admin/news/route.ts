import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

// Helper to check admin
async function isAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.role === "admin";
  } catch {
    return false;
  }
}
 
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const news = await prisma.news.findMany({ 
    orderBy: { createdAt: 'desc' } 
  });
  return NextResponse.json(news);
}
 
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await req.json();
   
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;
  let adminId = null;
  
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      adminId = decoded.userId || null;
    } catch {}
  }
  
  try {
    const news = await prisma.news.create({
      data: {
        description: data.description,
        status: data.status ?? true,
        createdBy: adminId
      },
    });
    return NextResponse.json(news, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Update a news item
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await req.json();
  
  try {
    const news = await prisma.news.update({
      where: { id: parseInt(data.id) },
      data: {
        description: data.description,
        status: data.status
      },
    });
    return NextResponse.json(news);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Delete a news item
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await req.json();
  
  try {
    await prisma.news.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH: Toggle status of a news item
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await req.json();
  
  try {
    const news = await prisma.news.findUnique({ where: { id: parseInt(id) } });
    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }
    
    const updated = await prisma.news.update({
      where: { id: parseInt(id) },
      data: { status: !news.status },
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}