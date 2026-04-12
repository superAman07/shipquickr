import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all completed remittances
export async function GET(req: NextRequest) {
    try {
        const remittances = await prisma.remittance.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { orders: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ success: true, data: remittances }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching completed remittances:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch completed remittances" },
            { status: 500 }
        );
    }
}

// POST process a new remittance for a user
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId,
            orderIds,
            utrReference,
            remittanceDate,
            earlyCodCharge = 0,
            otherDeductions = 0,
            remarks,
        } = body;

        if (!userId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !remittanceDate || !utrReference) {
            return NextResponse.json(
                { success: false, error: "Missing required fields (userId, orderIds, utrReference, remittanceDate)." },
                { status: 400 }
            );
        }

        // Run within a transaction to ensure atomic execution
        const newRemittance = await prisma.$transaction(async (tx) => {
            // 1. Fetch and validate the orders
            const orders = await tx.order.findMany({
                where: {
                    id: { in: orderIds },
                    userId: userId,
                    paymentMode: { equals: "COD", mode: "insensitive" },
                    status: "delivered",
                    remittanceId: null, // Ensure not already remitted
                },
            });

            if (orders.length !== orderIds.length) {
                throw new Error("One or more orders are invalid or already remitted.");
            }

            // 2. Calculate values
            let collectableValue = 0;
            let netOffAmount = 0; // Freight/Shipping costs deducted

            orders.forEach((order) => {
                collectableValue += order.codAmount || 0;
                netOffAmount += order.shippingCost || 0;
            });

            const codPaid = collectableValue - netOffAmount - earlyCodCharge - otherDeductions;

            // 3. Create the Remittance record
            const remittance = await tx.remittance.create({
                data: {
                    userId,
                    remittanceDate: new Date(remittanceDate),
                    utrReference,
                    collectableValue,
                    netOffAmount,
                    earlyCodCharge,
                    otherDeductions,
                    codPaid,
                    remarks,
                    orders: {
                        connect: orders.map((o) => ({ id: o.id })),
                    },
                },
            });

            return remittance;
        });

        return NextResponse.json({ success: true, data: newRemittance }, { status: 201 });
    } catch (error: any) {
        console.error("Error processing remittance:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process remittance" },
            { status: 500 }
        );
    }
}
