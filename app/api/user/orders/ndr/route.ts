import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('userToken')?.value;
    if(!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const decoded = jwtDecode<TokenDetailsType>(token)
    if(decoded.exp * 1000 < Date.now()){
        return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
    }
    const orders = await prisma.order.findMany({
        where: { 
        status: { in: ["undelivered", "rto_intransit", "rto_delivered", "lost_shipment"] },
        userId: decoded.userId,
        },
        orderBy: { createdAt: "desc" },
    });
    
    const ordersWithCourier = orders.map(order => ({
        ...order,
        courierName: order.courierName || "DemoCourier",
    }));

    return NextResponse.json({ orders: ordersWithCourier });
}