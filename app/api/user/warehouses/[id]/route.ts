import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
    }

    const data = await req.json();
    const url = new URL(req.url);
    const id = Number(url.pathname.split("/").pop());
    if (isNaN(id)) return new Response(JSON.stringify({ error: "Warehouse ID missing" }), { status: 400 });
    // const warehouseId = Number(params.id);
 
    if (data.isPrimary === true) {
      await prisma.warehouse.updateMany({
        where: { userId: decoded.userId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.warehouse.update({
      where: { id, userId: decoded.userId },
      data,
    });

    return NextResponse.json({ warehouse: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
    } 
    const url = new URL(request.url);
    const id = Number(url.pathname.split("/").pop());
    if (isNaN(id)) return new Response(JSON.stringify({ error: "Warehouse ID missing" }), { status: 400 });
    
    const warehouse = await prisma.warehouse.findUnique({ where: { id: id } });
    if (!warehouse || warehouse.userId !== decoded.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.warehouse.delete({ where: { id, userId: decoded.userId } });
    return NextResponse.json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
  }
}