import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { delhiveryClient } from "@/lib/services/delhivery";

// Helper to fire the webhook asynchronously
async function fireWebhook(url: string, payload: any) {
    if (!url || url === "null" || url.trim() === "") return;
    try {
        // Validate URL format
        new URL(url);
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.log(`Webhook sent to ${url}`);
    } catch (err) {
        console.error(`Failed to send webhook to ${url}:`, err);
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
        }

        const apiKey = authHeader.split(" ")[1];

        // Find User
        const user = await prisma.user.findUnique({
            where: { merchantApiKey: apiKey },
            select: { id: true, kycStatus: true, webhookUrl: true }
        });

        if (!user) return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        if (user.kycStatus !== "approved") return NextResponse.json({ error: "KYC must be approved to use the API." }, { status: 403 });

        // Parse Data
        const data = await req.json();

        if (!data.orderId || !data.customerName || !data.mobile || !data.address || !data.pincode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- 0. WAREHOUSE LOOKUP LOGIC ---
        // 1. Fetch exact warehouse if CelsiusPop provided ID
        let targetWarehouse = null;
        if (data.warehouseId) {
            targetWarehouse = await prisma.warehouse.findUnique({
                where: { id: parseInt(String(data.warehouseId)) }
            });
        }

        // 2. Fallback: If no ID provided (or invalid), try to find their Primary Warehouse
        if (!targetWarehouse) {
            targetWarehouse = await prisma.warehouse.findFirst({
                where: { userId: user.id, isPrimary: true }
            });
        }

        // 3. Ultimate fallback: Just grab any warehouse they own if they have no Primary
        if (!targetWarehouse) {
            targetWarehouse = await prisma.warehouse.findFirst({
                where: { userId: user.id }
            });
        }

        if (!targetWarehouse) {
            return NextResponse.json({ error: "You must configure at least one pickup warehouse." }, { status: 400 });
        }

        // Ignore the CelsiusPop string, strictly use the exact string from the DB
        let numericWarehouseId = targetWarehouse.id;
        let actualPickupLocation = targetWarehouse.warehouseName;

        // TS Error Fix: strictly type the enums
        const paymentModeEnum: "Prepaid" | "COD" = data.paymentMode === "COD" ? "COD" : "Prepaid";
        const weight = parseFloat(data.physicalWeight) || 0.5;

        // --- 1. CREATE ORDER FIRST (Safely in Shipquickr regardless of dispatch success) ---
        const PENDING_STATUS = "unshipped" as const;

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                orderId: String(data.orderId),
                orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
                paymentMode: paymentModeEnum,
                physicalWeight: weight,
                length: parseFloat(data.length) || 10,
                breadth: parseFloat(data.breadth) || 10,
                height: parseFloat(data.height) || 10,
                pickupLocation: actualPickupLocation,
                warehouseId: numericWarehouseId,
                codAmount: paymentModeEnum === "COD" ? (parseFloat(data.codAmount || data.totalAmount) || 0) : null,
                customerName: data.customerName,
                mobile: String(data.mobile),
                email: data.email || null,
                address: data.address,
                pincode: String(data.pincode),
                state: data.state || "Unknown",
                city: data.city || "Unknown",
                status: PENDING_STATUS,
            }
        });

        const orderItemsData = data.items.map((item: any) => ({
            orderId: order.id,
            productName: item.productName || "Unknown Product",
            category: item.category || "General",
            quantity: parseInt(item.quantity) || 1,
            orderValue: parseFloat(item.price || item.orderValue) || 0,
            hsn: item.hsn || null,
        }));

        await prisma.orderItem.createMany({ data: orderItemsData });

        let responseOrder = { ...order, items: orderItemsData } as any;
        let dispatchMessage = "Saved as Unshipped";

        // --- 2. ATTEMPT AUTO-DISPATCH GRACEFULLY ---
        try {
            const assignments = await prisma.userCourierAssignment.findMany({
                where: { userId: user.id },
                orderBy: { apiPriority: 'asc' }
            });

            // If user has NO assignments (hasn't set priorities yet), we consider all ACTIVE by default
            // If user HAS assignments, we respect the 'isActive' flag
            const activeAssignments = assignments.length === 0
                ? [{ courier: "Delhivery Express", apiPriority: 1 }] // Safe default for auto-dispatch
                : assignments.filter(a => a.isActive);

            if (activeAssignments.length > 0) {
                // Pick the first one (highest priority)
                const topPriorityAssignment = activeAssignments[0];
                const selectedCourierName = topPriorityAssignment.courier;

                // Determine mode based on courier name string
                const selectedMode: "Express" | "Surface" = selectedCourierName.toLowerCase().includes("express") ? "Express" : "Surface";

                const rateCalc = await delhiveryClient.fetchRate(
                    targetWarehouse.pincode,
                    String(data.pincode),
                    weight,
                    selectedMode,
                    paymentModeEnum,
                    parseFloat(data.totalAmount) || 0
                );

                if (rateCalc) {
                    const finalShippingCost = rateCalc.totalPrice;
                    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

                    if (wallet && wallet.balance >= finalShippingCost) {
                        // We have balance, book the shipment inside a transaction
                        const updatedOrder = await prisma.$transaction(async (tx) => {
                            await tx.wallet.update({
                                where: { userId: user.id },
                                data: { balance: { decrement: finalShippingCost } },
                            });

                            const fullOrderForDelhivery = {
                                ...order,
                                warehouse: targetWarehouse,
                                items: orderItemsData
                            };
                            const bookingResult = await delhiveryClient.createOrder(fullOrderForDelhivery, selectedMode);

                            if (!bookingResult || !bookingResult.waybill) {
                                throw new Error("Delhivery API failed to generate AWB.");
                            }

                            let labelUrl = "";
                            const labelResult = await delhiveryClient.generateLabel(bookingResult.waybill);
                            if (labelResult.success && labelResult.url) {
                                labelUrl = labelResult.url;
                            }

                            const upOrder = await tx.order.update({
                                where: { id: order.id },
                                data: {
                                    status: "manifested",
                                    courierName: selectedCourierName,
                                    labelUrl: labelUrl,
                                    awbNumber: bookingResult.waybill,
                                }
                            });

                            await tx.transaction.create({
                                data: {
                                    userId: user.id,
                                    amount: finalShippingCost,
                                    type: "debit",
                                    status: "completed",
                                    orderId: upOrder.id,
                                    remarks: `Auto-Shipment for Order #${upOrder.orderId} via ${selectedCourierName}`,
                                }
                            });

                            return { ...upOrder, awbNumber: bookingResult.waybill, labelUrl: labelUrl };
                        });

                        responseOrder = updatedOrder;
                        dispatchMessage = "Auto-Shipped via " + selectedCourierName;

                        // Fire the webhook for auto-shipment
                        if (user.webhookUrl) {
                            await fireWebhook(user.webhookUrl, {
                                event: "order_shipped",
                                orderId: responseOrder.orderId,
                                shipquickrId: responseOrder.id,
                                awb: responseOrder.awbNumber,
                                courierUrl: responseOrder.labelUrl,
                                status: "manifested"
                            });
                        }
                    } else {
                        dispatchMessage = "Saved as Unshipped (Insufficient balance for Auto-Dispatch)";
                    }
                } else {
                    dispatchMessage = "Saved as Unshipped (Pincode not serviceable by auto-courier)";
                }
            } else {
                dispatchMessage = "Saved as Unshipped (No couriers assigned to user)";
            }
        } catch (dispatchErr: any) {
            console.error("Auto-dispatch gracefully failed:", dispatchErr.message);
            dispatchMessage = `Saved as Unshipped (Dispatch Error: ${dispatchErr.message})`;
        }

        // 3. Return Success to CelsiusPop ALWAYS!
        return NextResponse.json({
            success: true,
            message: `Order successfully synced. ${dispatchMessage}`,
            order: responseOrder
        }, { status: 201 });

    } catch (error: any) {
        console.error("API Error creating order:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) {
            return NextResponse.json({ error: "This Order ID already exists in Shipquickr." }, { status: 409 });
        }
        return NextResponse.json({ error: "Server Error: Failed to create order", details: error.message }, { status: 500 });
    }
}
