import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";

interface TokenDetailsType {
  userId: number;
  email: string;
  exp: number;
}

interface SelectedCourier {
    name: string;
    rate: number; 
    codCharges: number; 
    totalPrice: number;  
}
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    const userId = decoded.userId;

    const body = await req.json();
    const { orderId, selectedCourier }: { orderId: number; selectedCourier: SelectedCourier } = body;

    if (!orderId || !selectedCourier || !selectedCourier.name || selectedCourier.totalPrice == null || isNaN(selectedCourier.totalPrice)) {
      return NextResponse.json({ error: "Missing orderId or valid selectedCourier details (name, totalPrice)" }, { status: 400 });
    }

    console.log(`Simplified Shipment Confirmation Request for Order ID: ${orderId}, User ID: ${userId}, Courier: ${selectedCourier.name}`);

    const dbTransactionResult = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId, userId: userId },
        });

        if (!order) {
            return { success: false, error: "Order not found or does not belong to user.", status: 404 };
        }
        if (order.status !== "unshipped") {
            return { success: false, error: `Order status is already '${order.status}'. Cannot process again.`, status: 400 };
        }
        if (!order.warehouseId) {
            console.warn(`Order ID ${order.id} has no warehouseId. This might be an issue for future manifest.`);
        }

        const finalShippingCost = selectedCourier.totalPrice;
        let updatedWalletBalance: number | undefined = undefined;

        if (order.paymentMode === "Prepaid") {
            const wallet = await tx.wallet.findUnique({ where: { userId: userId } });
            const currentBalance = wallet?.balance ?? 0;
            if (currentBalance < finalShippingCost) {
                return { success: false, error: `Insufficient wallet balance. Required: ₹${finalShippingCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`, status: 402 };
            }
            const updatedWallet = await tx.wallet.update({
                where: { userId: userId },
                data: { balance: { decrement: finalShippingCost } },
            });
            updatedWalletBalance = updatedWallet.balance;
            await tx.transaction.create({
                data: {
                    userId: userId,
                    amount: finalShippingCost,
                    type: "debit",
                    status: "Success",
                    orderId: order.id,  
                },
            });
        }
 
        const placeholderAwb = `SQ-DUMMY-${order.id}-${Date.now().toString().slice(-6)}`;
        const newStatus = "pending_manifest";  

        await tx.order.update({
            where: { id: order.id },
            data: {
                status: newStatus,
                awbNumber: placeholderAwb,
                courierName: selectedCourier.name,
                shippingCost: finalShippingCost,
                shippingDetails: `AWB ${placeholderAwb} assigned (placeholder). Pending actual manifest.`,
            },
        });

        return {
            success: true,
            orderIdFromDb: order.id,
            orderSystemId: order.orderId, 
            awbAssigned: placeholderAwb,
            updatedWalletBalance: updatedWalletBalance,
            finalStatus: newStatus
        };
    });

    if (!dbTransactionResult || !dbTransactionResult.success) {
        return NextResponse.json({ error: dbTransactionResult.error || "Database transaction failed" }, { status: (dbTransactionResult as any).status || 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Order ID ${dbTransactionResult.orderSystemId} processed. AWB ${dbTransactionResult.awbAssigned} assigned. Status: ${dbTransactionResult.finalStatus}`,
        orderId: dbTransactionResult.orderIdFromDb,
        awbNumber: dbTransactionResult.awbAssigned,
        courierName: selectedCourier.name,
        newBalance: dbTransactionResult.updatedWalletBalance,
        orderStatus: dbTransactionResult.finalStatus
    });

  } catch (error: any) {
    console.error("Shipment Confirmation Error (Simplified Flow):", error);
    let errorMessage = "Failed to process shipment due to an unexpected error.";
    let errorStatus = 500;

    if (error.message?.includes("Insufficient wallet balance")) {
        errorMessage = error.message;
        errorStatus = 402;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage, details: error.cause || "An unknown error occurred" }, { status: errorStatus });
  }
}