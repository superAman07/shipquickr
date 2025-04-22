import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwtDecode<TokenDetailsType>(token);

    const data = await req.json();
    const warehouseId = Number(params.id);
 
    if (data.isPrimary === true) {
      await prisma.warehouse.updateMany({
        where: { userId: decoded.userId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.warehouse.update({
      where: { id: warehouseId, userId: decoded.userId },
      data,
    });

    return NextResponse.json({ warehouse: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwtDecode<TokenDetailsType>(token);

    const warehouseId = Number(params.id); 
    
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse || warehouse.userId !== decoded.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.warehouse.delete({ where: { id: warehouseId } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
  }
}