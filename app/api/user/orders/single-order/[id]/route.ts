import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop(); 
    if (!id) return NextResponse.json({ error: "Order ID missing" }, { status: 400 });


    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.kycStatus !== "approved") {
      return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order || order.userId !== decoded.userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

export async function GET(request: Request) {
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get("userToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) {
          return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "Order ID missing" }, { status: 400 });

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
              items: true,
              warehouse: true,
            }, 
        });
        if (!order || order.userId !== decoded.userId) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ order }, { status: 200 });
    }catch(e){
        console.error("Error fetching single order:", e);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}