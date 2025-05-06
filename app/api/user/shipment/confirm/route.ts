import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma"; 
import axios from "axios";

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

    if (!orderId || !selectedCourier || !selectedCourier.name || selectedCourier.totalPrice == null) {
      return NextResponse.json({ error: "Missing orderId or valid selectedCourier details" }, { status: 400 });
    }

    console.log(`Shipment Confirmation Request for Order ID: ${orderId}, User ID: ${userId}, Courier: ${selectedCourier.name}`);
   
    const result = await prisma.$transaction(async (tx) => {

        const order = await tx.order.findUnique({
            where: { id: orderId, userId: userId },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json("Order not found or does not belong to user");
        }
        if (order.status !== "unshipped") {
            return NextResponse.json(`Order status is already '${order.status}'. Cannot ship again.`);
        }
        if (!order.warehouseId) {
            throw new Error("Warehouse ID not linked to this order.");
        }
        const warehouse = await tx.warehouse.findUnique({
            where: {
                id: order.warehouseId,
                userId: userId  
            }
        });
        if (!warehouse) {
            return NextResponse.json("Pickup warehouse details not found for this order.");
        }

        console.log("Order Details:", order);
        console.log("Selected Courier:", selectedCourier);
        console.log("Pickup Warehouse:", warehouse);

        // 5. Calculate Final Shipping Cost (Use cost from frontend)
        const finalShippingCost = selectedCourier.totalPrice;
        if (finalShippingCost == null || isNaN(finalShippingCost) || finalShippingCost < 0) {
             return NextResponse.json("Invalid final shipping cost received.");
        }

        // 6. Wallet Check & Deduction (for Prepaid)
        let updatedWalletBalance: number | undefined = undefined;
        if (order.paymentMode === "Prepaid") {
            const wallet = await tx.wallet.findUnique({
                where: { userId: userId },
            });
            const currentBalance = wallet?.balance ?? 0;

            if (currentBalance < finalShippingCost) {
                return NextResponse.json(`Insufficient wallet balance. Required: ₹${finalShippingCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`);
            }

            // Deduct balance
            const updatedWallet = await tx.wallet.update({
                where: { userId: userId },
                data: { balance: { decrement: finalShippingCost } },
            });
            updatedWalletBalance = updatedWallet.balance; // Store new balance

            // Create transaction record
            await tx.transaction.create({
                data: {
                    userId: userId,
                    amount: finalShippingCost,
                    type: "debit",
                    status: "Success",
                    orderId: order.id,  
                },
            });
            console.log(`Wallet balance updated for User ID ${userId}. New balance: ${updatedWalletBalance}`);
        }
 
        let courierPayload: any;
        let courierApiUrl: string | undefined;
        let requiresFormData = false;
        let generatedAwb: string | null = null;
        let labelUrl: string | null = null;
        if (selectedCourier.name === "Ecom Express") {
            requiresFormData = true;
            courierApiUrl = process.env.ECOM_EXPRESS_MANIFEST_API_URL; 

            if (!courierApiUrl) {
                return NextResponse.json("Ecom Express Manifest API URL is not configured.");
            }

            if (!order.warehouseId) {
                throw new Error("Warehouse ID not linked to this order.");
            }
            const warehouse = await tx.warehouse.findUnique({
                where: {
                    id: order.warehouseId, 
                    userId: userId
                }
            });
            if (!warehouse) {
                return NextResponse.json("Pickup warehouse details not found for this order.");
            }
            
            const ecomShipmentDetails = {
                // AWB_NUMBER: preAllocatedAwb || "", // Only if required
                ORDER_NUMBER: order.orderId,
                PRODUCT: order.paymentMode === "COD" ? "COD" : "PPD",
                CONSIGNEE: order.customerName,
                CONSIGNEE_ADDRESS1: order.address,
                CONSIGNEE_ADDRESS2: order.landmark || "",
                CONSIGNEE_ADDRESS3: "",
                DESTINATION_CITY: order.city,
                PINCODE: order.pincode,
                STATE: order.state,
                MOBILE: order.mobile,
                TELEPHONE: order.mobile,
                ITEM_DESCRIPTION: order.items.map(item => item.productName).join(', ').substring(0, 50),
                PIECES: 1,
                COLLECTABLE_VALUE: order.paymentMode === "COD" ? order.codAmount || 0 : 0,
                DECLARED_VALUE: Math.max(calculateTotalOrderValue(order.items) || 0, 1), 
                ACTUAL_WEIGHT: Math.max(order.physicalWeight || 0, 0.01),  
                VOLUMETRIC_WEIGHT: calculateVolumetricWeight(order.length, order.breadth, order.height),
                LENGTH: order.length || 1,  
                BREADTH: order.breadth || 1,
                HEIGHT: order.height || 1,
                PICKUP_NAME: warehouse.warehouseName,
                PICKUP_ADDRESS_LINE1: warehouse.address1,
                PICKUP_ADDRESS_LINE2: warehouse.address2 || "",
                PICKUP_PINCODE: warehouse.pincode,
                PICKUP_PHONE: warehouse.mobile,
                PICKUP_MOBILE: warehouse.mobile,
                RETURN_NAME: warehouse.warehouseName,
                RETURN_ADDRESS_LINE1: warehouse.address1,
                RETURN_ADDRESS_LINE2: warehouse.address2 || "",
                RETURN_PINCODE: warehouse.pincode,
                RETURN_PHONE: warehouse.mobile,
                RETURN_MOBILE: warehouse.mobile,
                // --- Add other MANDATORY fields based on documentation ---
                // Fetch GSTIN from KYC if available
                // const kyc = await tx.kyc.findUnique({ where: { userId: userId } });
                // SELLER_GSTIN: kyc?.gstNumber || "YOUR_DEFAULT_GSTIN_IF_APPLICABLE",
                SELLER_GSTIN: "", // Placeholder - Fetch from KYC
                HSN_CODE: order.items[0]?.hsn || "", // Use HSN from first item
                INVOICE_NUMBER: `INV-${order.orderId}`,
                INVOICE_DATE: new Date(order.orderDate).toISOString().split('T')[0], // YYYY-MM-DD
                // ... any other mandatory fields ...
            };

            const formData = new URLSearchParams();
            formData.append("username", process.env.ECOM_EXPRESS_USERNAME || "");
            formData.append("password", process.env.ECOM_EXPRESS_PASSWORD || "");
            formData.append("json_input", JSON.stringify([ecomShipmentDetails]));
            courierPayload = formData;

            // 8. Call Courier API for AWB Generation
            console.log("Calling Ecom Express Manifest API...");
            const apiResponse = await axios.post(courierApiUrl, courierPayload);
            console.log("Ecom Express Manifest API Response:", apiResponse.data);

            // Check response and extract AWB
            if (apiResponse.data && Array.isArray(apiResponse.data.shipments) && apiResponse.data.shipments.length > 0 && apiResponse.data.shipments[0].success === true) {
                generatedAwb = apiResponse.data.shipments[0].awb;
                console.log(`Ecom Express AWB Generated: ${generatedAwb}`);
                // Optionally, try to fetch the label URL right away
                // labelUrl = await fetchEcomLabel(generatedAwb);
            } else { 
                return NextResponse.json(`Ecom Express AWB generation failed: ${apiResponse.data?.shipments?.[0]?.reason || JSON.stringify(apiResponse.data)}`);
            }

        } else if (selectedCourier.name === "Xpressbees") {
            // TODO: Implement Xpressbees AWB generation logic here
            // 1. Find Xpressbees AWB API endpoint and payload structure
            // 2. Prepare payload using order and warehouse data
            // 3. Call Xpressbees API (using Bearer token from getValidXpressbeesToken)
            // 4. Extract AWB from response
            // 5. Handle errors
            console.warn("Xpressbees shipment confirmation not implemented yet.");
            return NextResponse.json("Xpressbees integration not ready.");  

        } else {
            return NextResponse.json(`Courier '${selectedCourier.name}' integration not supported.`);
        }
 
        if (!generatedAwb) {
            return NextResponse.json("AWB Number was not generated successfully.");
        }

        const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
                status: "shipped",
                awbNumber: generatedAwb,
                courierName: selectedCourier.name,    
                labelUrl: labelUrl,  
                shippingDetails: `Shipped via ${selectedCourier.name}. AWB: ${generatedAwb}`,
            },
        });
        console.log(`Order ${order.id} successfully updated to shipped status.`);
        return {
            success: true,
            message: `Shipment confirmed successfully for Order ID ${order.orderId}.`,
            orderId: order.id,
            awbNumber: generatedAwb,
            courierName: selectedCourier.name,
            newBalance: updatedWalletBalance,
            labelUrl: labelUrl,
        };
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Shipment Confirmation Error:", error); 
    return NextResponse.json({
        success: false,
        error: "Failed to confirm shipment",
        details: error.message || "An unknown error occurred"
    }, { status: error.message.includes("Insufficient wallet balance") ? 402 : 500 }); // 402 for insufficient balance
  }
}

function calculateTotalOrderValue(items: { orderValue: number | string | null, quantity: number | string | null }[]): number {
    return items.reduce((sum, item) => sum + (parseFloat(String(item.orderValue ?? 0)) || 0) * (parseInt(String(item.quantity ?? 1)) || 1), 0);
}

function calculateVolumetricWeight(length?: number | null, breadth?: number | null, height?: number | null): number {
    const l = length || 1;
    const b = breadth || 1;
    const h = height || 1;
    return Math.max((l * b * h) / 5000, 0.01); 
}

// --- TODO: Implement if needed ---
// async function fetchEcomAwb(tx: any): Promise<string | null> {
//   // Call Ecom Express Fetch Waybill API (https://api.ecomexpress.in/apiv2/fetch_awb/)
//   // Use username/password
//   // Return one unused AWB number
// }

// async function fetchEcomLabel(awb: string): Promise<string | null> {
//   // Call Ecom Express Label API (https://shipment.ecomexpress.in/services/expp/shipping_label)
//   // Check required parameters (might need more than just AWB)
//   // Return the URL or handle label download/storage
// }