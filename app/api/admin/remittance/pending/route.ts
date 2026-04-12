import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // We want to fetch all orders that are COD, Delivered, and not yet remitted
        // and group them nicely by User (Seller)

        const pendingOrders = await prisma.order.findMany({
            where: {
                paymentMode: { equals: "COD", mode: "insensitive" },
                status: { equals: "delivered" }, // Only delivered COD gets remitted to seller
                remittanceId: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "asc", // older deliveries first
            },
        });

        // Grouping by User
        const grouped = pendingOrders.reduce((acc: any, order) => {
            const uId = order.userId;
            if (!acc[uId]) {
                acc[uId] = {
                    user: order.user,
                    orders: [],
                    totalCod: 0,
                    totalFreight: 0,
                };
            }
            acc[uId].orders.push(order);
            acc[uId].totalCod += order.codAmount || 0; // Using codAmount
            acc[uId].totalFreight += order.shippingCost || 0;
            return acc;
        }, {});

        // Convert object back to array
        const result = Object.values(grouped);

        return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching pending remittance:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch pending remittance" },
            { status: 500 }
        );
    }
}
