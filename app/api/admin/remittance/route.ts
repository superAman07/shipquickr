import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all completed remittances (with linked order details for expandable rows)
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
                orders: {
                    select: {
                        id: true,
                        orderId: true,
                        awbNumber: true,
                        codAmount: true,
                        shippingCost: true,
                        courierName: true,
                        customerName: true,
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

// POST — process a new remittance for a user
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

        const newRemittance = await prisma.$transaction(async (tx) => {
            const orders = await tx.order.findMany({
                where: {
                    id: { in: orderIds },
                    userId: userId,
                    paymentMode: { equals: "COD", mode: "insensitive" },
                    status: "delivered",
                    remittanceId: null,
                },
            });

            if (orders.length !== orderIds.length) {
                throw new Error("One or more orders are invalid or already remitted.");
            }

            let collectableValue = 0;
            let netOffAmount = 0;

            orders.forEach((order) => {
                collectableValue += order.codAmount || 0;
                netOffAmount += order.shippingCost || 0;
            });

            const codPaid = collectableValue - netOffAmount - earlyCodCharge - otherDeductions;

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

// PUT — edit an existing remittance (UTR, date, remarks)
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { remittanceId, utrReference, remittanceDate, remarks } = body;

        if (!remittanceId) {
            return NextResponse.json(
                { success: false, error: "Missing remittanceId." },
                { status: 400 }
            );
        }

        const existing = await prisma.remittance.findUnique({ where: { id: remittanceId } });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Remittance record not found." },
                { status: 404 }
            );
        }

        const updated = await prisma.remittance.update({
            where: { id: remittanceId },
            data: {
                ...(utrReference && { utrReference }),
                ...(remittanceDate && { remittanceDate: new Date(remittanceDate) }),
                ...(remarks !== undefined && { remarks }),
            },
        });

        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating remittance:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update remittance" },
            { status: 500 }
        );
    }
}

// DELETE — reverse a remittance (unlink orders, delete record)
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const remittanceId = parseInt(searchParams.get("id") || "0");

        if (!remittanceId) {
            return NextResponse.json(
                { success: false, error: "Missing remittance id." },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            // 1. Unlink all orders from this remittance
            await tx.order.updateMany({
                where: { remittanceId },
                data: { remittanceId: null },
            });

            // 2. Delete the remittance record itself
            await tx.remittance.delete({
                where: { id: remittanceId },
            });
        });

        return NextResponse.json({ success: true, message: "Remittance reversed successfully." }, { status: 200 });
    } catch (error: any) {
        console.error("Error reversing remittance:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to reverse remittance" },
            { status: 500 }
        );
    }
}
