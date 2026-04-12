import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, action, remarks } = body;

        if (!orderId || !action) {
            return NextResponse.json({ error: "orderId and action are required" }, { status: 400 });
        }

        if (!["re-attempt", "rto"].includes(action)) {
            return NextResponse.json({ error: "action must be 're-attempt' or 'rto'" }, { status: 400 });
        }

        // Verify the order belongs to this user and is in NDR-eligible status
        const order = await prisma.order.findFirst({
            where: {
                id: Number(orderId),
                userId: decoded.userId,
                status: { in: ["undelivered", "rto_intransit", "rto_delivered", "lost_shipment"] },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found or not eligible for NDR action" }, { status: 404 });
        }

        // Update the order with the NDR action
        if (action === "rto") {
            // Mark as RTO — change status to rto_intransit
            await prisma.order.update({
                where: { id: Number(orderId) },
                data: {
                    ndrAction: "rto",
                    ndrActionRemarks: remarks || "Marked for return by user",
                    status: "rto_intransit",
                },
            });
        } else {
            // Re-attempt — keep status as undelivered, save action + remarks
            await prisma.order.update({
                where: { id: Number(orderId) },
                data: {
                    ndrAction: "re-attempt",
                    ndrActionRemarks: remarks || "Re-attempt requested",
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: action === "rto"
                ? "Order marked for return (RTO)"
                : "Re-attempt requested successfully",
        });
    } catch (error) {
        console.error("NDR Action Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
