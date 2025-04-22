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
  
      // If isPrimary is being set to true, set all others to false for this user
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