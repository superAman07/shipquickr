import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";

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

function calculateTotalOrderValue(items: { orderValue: number | string | null, quantity: number | string | null }[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (parseFloat(String(item.orderValue ?? 0)) || 0) * (parseInt(String(item.quantity ?? 1)) || 1), 0);
}

function calculateVolumetricWeight(length?: number | null, breadth?: number | null, height?: number | null): number {
    const l = length || 1;
    const b = breadth || 1;
    const h = height || 1;
    const volume = (l * b * h) / 5000;
    return parseFloat(volume.toFixed(2));
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

    console.log(`Shipment Confirmation Request for Order ID: ${orderId}, User ID: ${userId}, Courier: ${selectedCourier.name}`);

    let fetchedAwbFromApi: string | null = null;
    let orderDetailsForManifest: any = null;
    let warehouseDetailsForManifest: any = null;
    let labelUrl: string | null = null;

    if (selectedCourier.name === "Ecom Express") {
        fetchedAwbFromApi = await ecomExpressClient.fetchAwbNumber();
        if (!fetchedAwbFromApi) {
            console.error("Ecom Express: Failed to fetch AWB number before transaction.");
            return NextResponse.json({ error: "Failed to obtain AWB from Ecom Express. Courier API might be down or configuration issue." }, { status: 503 });
        }
        console.log("Ecom Express: Successfully fetched AWB before transaction:", fetchedAwbFromApi);
    }

    const dbTransactionResult = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId, userId: userId },
            include: { items: true },
        });

        if (!order) {
            return { success: false, error: "Order not found or does not belong to user.", status: 404 };
        }
        if (order.status !== "unshipped") {
            return { success: false, error: `Order status is already '${order.status}'. Cannot ship again.`, status: 400 };
        }
        if (!order.warehouseId) {
            console.error(`Critical: Order ID ${order.id} has no warehouseId.`);
            return { success: false, error: "Order is missing critical pickup location information (warehouseId).", status: 500 };
        }

        const warehouse = await tx.warehouse.findUnique({
            where: { id: order.warehouseId, userId: userId }
        });

        if (!warehouse) {
            return { success: false, error: "Pickup warehouse details not found for this order.", status: 404 };
        }

        orderDetailsForManifest = order;
        warehouseDetailsForManifest = warehouse;

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

        await tx.order.update({
            where: { id: order.id },
            data: {
                status: "pending_manifest",
                awbNumber: selectedCourier.name === "Ecom Express" ? fetchedAwbFromApi : null,
                courierName: selectedCourier.name, 
            },
        });

        return {
            success: true,
            orderIdFromDb: order.id,
            orderSystemId: order.orderId,
            awbToManifest: selectedCourier.name === "Ecom Express" ? fetchedAwbFromApi : null,
            updatedWalletBalance: updatedWalletBalance
        };
    });

    if (!dbTransactionResult || !dbTransactionResult.success) {
        return NextResponse.json({ error: dbTransactionResult.error || "Database transaction failed" }, { status: (dbTransactionResult as any).status || 500 });
    }

    let finalConfirmedAwb: string | null = dbTransactionResult.awbToManifest ?? null;

    if (selectedCourier.name === "Ecom Express") {
        if (!orderDetailsForManifest || !warehouseDetailsForManifest || !dbTransactionResult.awbToManifest) {
             console.error("Ecom Express: Missing details for manifest post-transaction.");
             await prisma.order.update({ where: { id: dbTransactionResult.orderIdFromDb }, data: { status: "manifest_failed", shippingDetails: "Internal error: Missing data for manifest." } });
             return NextResponse.json({ error: "Internal error preparing for Ecom Express manifest." }, { status: 500 });
        }
        const formatDate_DDMMYYYY = (date: Date): string => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const ecomShipmentPayload = {
            AWB_NUMBER: dbTransactionResult.awbToManifest,
            ORDER_NUMBER: orderDetailsForManifest.orderId,
            PRODUCT: orderDetailsForManifest.paymentMode === "COD" ? "COD" : "PPD",
            CONSIGNEE: orderDetailsForManifest.customerName,
            CONSIGNEE_ADDRESS1: orderDetailsForManifest.address,
            CONSIGNEE_ADDRESS2: orderDetailsForManifest.landmark || "",
            CONSIGNEE_ADDRESS3: "",
            DESTINATION_CITY: orderDetailsForManifest.city,
            PINCODE: orderDetailsForManifest.pincode,
            STATE: orderDetailsForManifest.state,
            MOBILE: orderDetailsForManifest.mobile,
            TELEPHONE: orderDetailsForManifest.mobile,
            ITEM_DESCRIPTION: orderDetailsForManifest.items.map((item:any) => item.productName).join(', ').substring(0, 50),
            PIECES: 1,
            COLLECTABLE_VALUE: orderDetailsForManifest.paymentMode === "COD" ? (orderDetailsForManifest.codAmount || 0) : 0,
            DECLARED_VALUE: Math.max(calculateTotalOrderValue(orderDetailsForManifest.items) || 0, 1),
            ACTUAL_WEIGHT: Math.max(orderDetailsForManifest.physicalWeight || 0, 0.01),
            VOLUMETRIC_WEIGHT: calculateVolumetricWeight(orderDetailsForManifest.length, orderDetailsForManifest.breadth, orderDetailsForManifest.height),
            LENGTH: orderDetailsForManifest.length || 1,
            BREADTH: orderDetailsForManifest.breadth || 1,
            HEIGHT: orderDetailsForManifest.height || 1,
            PICKUP_NAME: warehouseDetailsForManifest.contactName || warehouseDetailsForManifest.warehouseName,
            PICKUP_ADDRESS_LINE1: warehouseDetailsForManifest.address1,
            PICKUP_ADDRESS_LINE2: warehouseDetailsForManifest.address2 || "",
            PICKUP_PINCODE: warehouseDetailsForManifest.pincode,
            PICKUP_PHONE: warehouseDetailsForManifest.mobile,
            PICKUP_MOBILE: warehouseDetailsForManifest.mobile,
            RETURN_NAME: warehouseDetailsForManifest.contactName || warehouseDetailsForManifest.warehouseName,
            RETURN_ADDRESS_LINE1: warehouseDetailsForManifest.address1,
            RETURN_ADDRESS_LINE2: warehouseDetailsForManifest.address2 || "",
            RETURN_PINCODE: warehouseDetailsForManifest.pincode,
            RETURN_PHONE: warehouseDetailsForManifest.mobile,
            RETURN_MOBILE: warehouseDetailsForManifest.mobile,
            DG_SHIPMENT: "false",
            ADDITIONAL_INFORMATION: {
                GST_TAX_CGSTN:"", GST_TAX_IGSTN:"", GST_TAX_SGSTN:"",
                SELLER_GSTIN: "",
                INVOICE_DATE: formatDate_DDMMYYYY(new Date(orderDetailsForManifest.orderDate)),
                INVOICE_NUMBER: `INV-${orderDetailsForManifest.orderId}`,
                GST_TAX_RATE_SGSTN:"", GST_TAX_RATE_IGSTN:"", GST_TAX_RATE_CGSTN:"",
                GST_HSN: orderDetailsForManifest.items[0]?.hsn || "12345678",
                GST_TAX_BASE:"", GST_ERN:"", ESUGAM_NUMBER:"",
                ITEM_CATEGORY: orderDetailsForManifest.items[0]?.category || "General",
                GST_TAX_NAME:"", ESSENTIALPRODUCT: "N", PICKUP_TYPE: "WH",
                OTP_REQUIRED_FOR_DELIVERY: "N", RETURN_TYPE: "WH", GST_TAX_TOTAL:"",
                SELLER_TIN:"", CONSIGNEE_ADDRESS_TYPE: "HOME",
                CONSIGNEE_LONG: "", CONSIGNEE_LAT: "", what3words: ""
            }
        };
        const manifestResponse = await ecomExpressClient.manifestShipment(ecomShipmentPayload);
        if (manifestResponse && Array.isArray(manifestResponse.shipments) && manifestResponse.shipments.length > 0 && manifestResponse.shipments[0].success === true) {
            finalConfirmedAwb = manifestResponse.shipments[0].awb;
            await prisma.order.update({
                where: { id: dbTransactionResult.orderIdFromDb },
                data: { status: "shipped", awbNumber: finalConfirmedAwb, shippingDetails: `Shipped via Ecom Express. AWB: ${finalConfirmedAwb}` },
            });
            console.log(`Ecom Express Shipment Manifested & Order Updated. AWB: ${finalConfirmedAwb}`);
        } else {
            const reason = manifestResponse?.shipments?.[0]?.reason || JSON.stringify(manifestResponse);
            console.error(`Ecom Express shipment manifest failed: ${reason}`);
            await prisma.order.update({
                where: { id: dbTransactionResult.orderIdFromDb },
                data: { status: "manifest_failed", shippingDetails: `Ecom Express manifest failed: ${reason}` }
            });
            return NextResponse.json({ error: `Shipment manifest failed with Ecom Express: ${reason}. Order status updated.` }, { status: 400 });
        }
    } else if (selectedCourier.name === "Xpressbees") {
        console.warn("Xpressbees shipment confirmation not implemented yet.");
        await prisma.order.update({ where: { id: dbTransactionResult.orderIdFromDb }, data: { status: "manifest_failed", shippingDetails: "Xpressbees integration not ready." } });
        return NextResponse.json({ error: "Xpressbees integration is not yet available." }, { status: 501 });
    } else {
        console.error(`Courier '${selectedCourier.name}' integration not supported post-transaction.`);
        await prisma.order.update({ where: { id: dbTransactionResult.orderIdFromDb }, data: { status: "manifest_failed", shippingDetails: `Unsupported courier: ${selectedCourier.name}` } });
        return NextResponse.json({ error: `Courier '${selectedCourier.name}' integration not supported.` }, { status: 400 });
    }

    if (!finalConfirmedAwb) {
        console.error("Critical: AWB was not confirmed after manifest step for a supported courier.");
        await prisma.order.update({ where: { id: dbTransactionResult.orderIdFromDb }, data: { status: "manifest_failed", shippingDetails: "AWB confirmation failed post manifest." } });
        return NextResponse.json({ error: "AWB was not confirmed after courier processing." }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Shipment confirmed successfully for Order ID ${dbTransactionResult.orderSystemId}.`,
        orderId: dbTransactionResult.orderIdFromDb,
        awbNumber: finalConfirmedAwb,
        courierName: selectedCourier.name,
        newBalance: dbTransactionResult.updatedWalletBalance,
        labelUrl: labelUrl,
    });

  } catch (error: any) {
    console.error("Shipment Confirmation Error (Outer Catch):", error);
    let errorMessage = "Failed to confirm shipment due to an unexpected error.";
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