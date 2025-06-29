import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";

interface AdminTokenDetailsType {
    userId: number;
    email: string;
    role: string;
    exp: number;
}

interface SelectedCourier {
    name: string;
    rate: number;
    codCharges: number;
    totalPrice: number;
    serviceType?: string;
    weight: number;
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("adminToken")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized: Admin token missing" }, { status: 401 });
        }

        let decodedAdmin: AdminTokenDetailsType;
        try {
            decodedAdmin = jwtDecode<AdminTokenDetailsType>(token);
        } catch (error) {
            return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
        }

        if (decodedAdmin.exp * 1000 < Date.now()) {
            return NextResponse.json({ error: "Admin token expired" }, { status: 401 });
        }

        if (decodedAdmin.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }
        const adminPerformingActionId = decodedAdmin.userId;

        const body = await req.json();
        const { orderId, userId: targetUserId, selectedCourier }: { orderId: number; userId: number; selectedCourier: SelectedCourier } = body;

        if (!orderId || !targetUserId || !selectedCourier || !selectedCourier.name || selectedCourier.totalPrice == null || isNaN(selectedCourier.totalPrice)) {
            return NextResponse.json({ error: "Missing orderId, target userId, or valid selectedCourier details (name, totalPrice)" }, { status: 400 });
        }

        console.log(`ADMIN Shipment Confirmation: Admin ID ${adminPerformingActionId}, Order ID: ${orderId}, Target User ID: ${targetUserId}, Courier: ${selectedCourier.name}`);

        const order = await prisma.order.findUnique({
            where: { id: orderId, userId: targetUserId },
            include: { items: true, warehouse: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found or does not belong to the specified target user." }, { status: 404 });
        }

        const kycDetail = await prisma.kycDetail.findUnique({
            where: { userId: order.userId },
            select: { gstNumber: true }
        });

        if (!order.warehouse) {
            console.error(`Order ID ${order.id} is missing warehouse information, which is required for consigner details.`);
            return NextResponse.json({ error: "Order is missing critical warehouse (pickup location) information." }, { status: 400 });
        }

        if (order.status !== "unshipped") {
            return NextResponse.json({ error: `Order status is already '${order.status}'. Cannot process again.` }, { status: 400 });
        }

        if (!order.warehouseId) {
            console.warn(`Order ID ${order.id} has no warehouseId. This might be an issue for future manifest.`);
        }

        let actualAwbNumber: string | null = null; 
        let shippingId: string | null = null;
        let labelUrl: string | null = null; 

        if (selectedCourier.name === "Ecom Express") {
            console.log("ADMIN: Attempting to fetch AWB from Ecom Express...");
            actualAwbNumber = await ecomExpressClient.fetchAwbNumber(order.paymentMode as "COD" | "Prepaid");
            if (!actualAwbNumber) {
                console.error("ADMIN: Failed to fetch AWB number from Ecom Express.");
                return NextResponse.json({ error: "Failed to obtain AWB from Ecom Express. Please check API logs/config." }, { status: 503 });
            }
            console.log("ADMIN: Successfully fetched AWB from Ecom Express:", actualAwbNumber);
            const manifestSuccess = await ecomExpressClient.createManifest(actualAwbNumber, { ...order, kycDetail }); // kycDetail is for targetUser
            if (!manifestSuccess) {
                console.error("ADMIN: Manifest creation failed for Ecom Express AWB:", actualAwbNumber);
                return NextResponse.json({ error: "Manifest creation failed for Ecom Express. Please check API logs/balance." }, { status: 503 });
            }
        } else if (selectedCourier.name === "Xpressbees") {
            console.log("ADMIN: Attempting to fetch AWB from Xpressbees...");
            const shipmentDetails = await xpressbeesClient.generateAwb(order, selectedCourier.serviceType, kycDetail?.gstNumber);  
            if (!shipmentDetails) {
                return NextResponse.json({ error: "Failed to obtain AWB from Xpressbees." }, { status: 503 });
            }
            
            actualAwbNumber = shipmentDetails.awbNumber;
            const manifestSuccess = await xpressbeesClient.createManifest([actualAwbNumber]);
            if (!manifestSuccess) {
                console.error("ADMIN: Manifest creation failed for Xpressbees AWB:", actualAwbNumber);
                // We can continue even if manifest fails - manifest can be created later
            }
        } else {
            console.warn(`ADMIN: No specific AWB fetch logic for ${selectedCourier.name}. Using generic placeholder.`);
            actualAwbNumber = `GENERIC-ADMIN-${orderId}-${Date.now().toString().slice(-6)}`;
        }

        if (!actualAwbNumber) {
            console.error(`ADMIN: AWB Number could not be determined for courier: ${selectedCourier.name}`);
            return NextResponse.json({ error: `Could not determine AWB number for ${selectedCourier.name}.` }, { status: 500 });
        }

        const dbTransactionResult = await prisma.$transaction(async (tx) => {
            const finalShippingCost = selectedCourier.totalPrice;
            let updatedWalletBalance: number | undefined = undefined;

            if (order.paymentMode === "Prepaid") {
                const wallet = await tx.wallet.findUnique({ where: { userId: targetUserId } });
                const currentBalance = wallet?.balance ?? 0;
                if (currentBalance < finalShippingCost) {
                    return { success: false, error: `Insufficient wallet balance for user ${targetUserId}. Required: ₹${finalShippingCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`, status: 402 };
                }
                const updatedWallet = await tx.wallet.update({
                    where: { userId: targetUserId },
                    data: { balance: { decrement: finalShippingCost } },
                });
                updatedWalletBalance = updatedWallet.balance;
                await tx.transaction.create({
                    data: {
                        userId: targetUserId,
                        amount: finalShippingCost,
                        type: "debit",
                        status: "Success",
                        orderId: order.id,
                    },
                });
            }
            const isManifested = selectedCourier.name === "Ecom Express" || selectedCourier.name === "Xpressbees";
            const newStatus = isManifested ? "manifested" : "pending_manifest";
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: newStatus,
                    awbNumber: actualAwbNumber,
                    shippingId: shippingId,
                    labelUrl: labelUrl,
                    courierName: selectedCourier.name,
                    shippingCost: finalShippingCost,
                    billableWeight: selectedCourier.weight,
                    shippingDetails: selectedCourier.name === "Ecom Express"
                        ? `AWB ${actualAwbNumber} assigned and manifested with Ecom Express by Admin.`
                        : `AWB ${actualAwbNumber} assigned by Admin. Pending manifest creation.`,

                },
            });

            const baseCourierCost = selectedCourier.rate + selectedCourier.codCharges; // Assuming .rate is base freight and .codCharges is base COD
            await tx.courierPayable.create({
                data: {
                    courierName: selectedCourier.name,
                    amount: baseCourierCost,
                    orderId: order.id,
                    status: "pending",
                }
            });


            return {
                success: true,
                orderIdFromDb: order.id,
                orderSystemId: order.orderId,
                awbAssigned: actualAwbNumber,
                updatedWalletBalance: updatedWalletBalance,
                finalStatus: newStatus
            };
        });

        if (!dbTransactionResult || !dbTransactionResult.success) {
            const errorStatus = (dbTransactionResult as any)?.status || 500;
            return NextResponse.json({ error: dbTransactionResult.error || "Database transaction failed" }, { status: errorStatus });
        }

        return NextResponse.json({
            success: true,
            message: `Order ID ${dbTransactionResult.orderSystemId} (User: ${targetUserId}) processed by Admin. AWB ${dbTransactionResult.awbAssigned} assigned. Status: ${dbTransactionResult.finalStatus}`,
            orderId: dbTransactionResult.orderIdFromDb,
            awbNumber: dbTransactionResult.awbAssigned,
            courierName: selectedCourier.name,
            newBalance: dbTransactionResult.updatedWalletBalance,
            orderStatus: dbTransactionResult.finalStatus
        });

    } catch (error: any) {
        console.error("Admin Shipment Confirmation Error:", error);
        let errorMessage = "Failed to process shipment due to an unexpected error.";
        let errorStatus = 500;

        if (error.message?.includes("Insufficient wallet balance")) {
            errorMessage = error.message;
            errorStatus = 402;
        } else if (error.message) {
            errorMessage = error.message;
        }
        if (error.code && typeof error.code === 'string' && error.code.startsWith('P')) {
            console.error("Prisma Error in Admin Shipment Confirmation:", error.code, error.message);
            errorMessage = "A database error occurred while processing the shipment.";
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: errorStatus });
    }
}