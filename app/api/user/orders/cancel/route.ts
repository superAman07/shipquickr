import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";

interface TokenDetailsType {
    userId: number;
    email: string;
    exp: number;
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("userToken")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = jwtDecode<TokenDetailsType>(token);
        const userId = decoded.userId;
        const { orderId } = await req.json();
        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }
        const order = await prisma.order.findUnique({
            where: { id: Number(orderId), userId: userId }
        })
        if (!order) {
            return NextResponse.json({ error: "Order not found or you dont have permission to cancel it" }, { status: 404 });
        }
        if (!order.awbNumber || !order.courierName) {
            return NextResponse.json({ error: "Cannot cancel order without an AWB number and courier name" }, { status: 400 });
        }
        // let cancellationResult: { success: boolean; message: string };
        // if (order.courierName.toLowerCase().includes("ecom express")) {
        //     cancellationResult = await ecomExpressClient.cancelShipment(order.awbNumber);
        // } else if (order.courierName.toLowerCase().includes("xpressbees")) {
        //     cancellationResult = await xpressbeesClient.cancelShipment(order.awbNumber);
        // } else {
        //     return NextResponse.json({ error: `Cancellation for courier ${order.courierName} is not supported` }, { status: 400 });
        // }

        const cancellationResult = await shippingAggregatorClient.cancelOrder(order.orderId, order.awbNumber);

        if (cancellationResult.success) {
            await prisma.$transaction(async (tx) => {
                 
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: "cancelled",
                        shippingDetails: `Shipment cancelled by user. Courier confirmation: ${cancellationResult.message}`
                    },
                });

                if (order.shippingCost && order.shippingCost > 0) {
                    await tx.wallet.update({
                        where: { userId: userId },
                        data: { balance: { increment: order.shippingCost } },
                    });

                    await tx.transaction.create({
                        data: {
                            userId: userId,
                            amount: order.shippingCost,
                            type: "credit",
                            status: "Success",
                            orderId: order.id,
                            remarks: "Refund for cancelled shipment"
                        }
                    });
                }
            });
            return NextResponse.json({ success: true, message: "Order cancelled successfully" });
        } else {
            return NextResponse.json({ error: `Failed to cancel shipment with courier: ${cancellationResult.message}` }, { status: 502 });
        }
    } catch (error: any) {
        console.error("Cancel order API Error:", error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 })
    }
}