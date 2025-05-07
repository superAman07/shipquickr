import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma"; 
import { ecomExpressClient } from "@/lib/services/ecom-express";
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

    if (!orderId || !selectedCourier || !selectedCourier.name || selectedCourier.totalPrice == null || isNaN(selectedCourier.totalPrice)) {
      return NextResponse.json({ error: "Missing orderId or valid selectedCourier details (name, totalPrice)" }, { status: 400 });
    }

    console.log(`Simplified Shipment Confirmation Request for Order ID: ${orderId}, User ID: ${userId}, Courier: ${selectedCourier.name}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId },
      include: { items: true },  
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or does not belong to user." }, { status: 404 });
    }

    if (order.status !== "unshipped") {
      return NextResponse.json({ error: `Order status is already '${order.status}'. Cannot process again.` }, { status: 400 });
    }

    if (!order.warehouseId) {
      console.warn(`Order ID ${order.id} has no warehouseId. This might be an issue for future manifest.`);
    }

    let actualAwbNumber: string | null = null;

    if (selectedCourier.name === "Ecom Express") {
        console.log("Attempting to fetch AWB from Ecom Express (using temporary function)...");
        
        actualAwbNumber = await ecomExpressClient.fetchAwbNumber(order.paymentMode as "COD" | "Prepaid");
        if (!actualAwbNumber) {
            console.error("Failed to fetch AWB number from Ecom Express using temporary function.");
            return NextResponse.json({ error: "Failed to obtain AWB from Ecom Express. Please check API logs/config." }, { status: 503 });
        } 
        console.log("Successfully fetched AWB from Ecom Express (temporary function):", actualAwbNumber);
    } else if (selectedCourier.name === "Xpressbees") {
        console.warn("Xpressbees AWB fetch logic not implemented yet. Using placeholder.");
        const token = await getValidXpressbeesToken();
        if (!token) {
            return NextResponse.json({ error: "Failed to authenticate with Xpressbees." }, { status: 503 });
        }

        actualAwbNumber = await generateXpressbeesAwb(order, token);
        if (!actualAwbNumber) {
            return NextResponse.json({ error: "Failed to obtain AWB from Xpressbees." }, { status: 503 });
        }
    } else {
        console.warn(`No specific AWB fetch logic for ${selectedCourier.name}. Using generic placeholder.`);
        actualAwbNumber = `GENERIC-DUMMY-${orderId}-${Date.now().toString().slice(-6)}`;
    }

    if (!actualAwbNumber) {
        console.error(`AWB Number could not be determined for courier: ${selectedCourier.name}`);
        return NextResponse.json({ error: `Could not determine AWB number for ${selectedCourier.name}.` }, { status: 500 });
    }

    const dbTransactionResult = await prisma.$transaction(async (tx) => {
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
 
        const newStatus = "pending_manifest";  

        await tx.order.update({
            where: { id: order.id },
            data: {
                status: newStatus,
                awbNumber: actualAwbNumber,
                courierName: selectedCourier.name,
                shippingCost: finalShippingCost,
                shippingDetails: `AWB ${actualAwbNumber} assigned (placeholder). Pending actual manifest.`,
            },
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



async function generateXpressbeesAwb(order: any, token: string): Promise<string | null> {
    const payload = {
      id: `ORD-${order.id}`,
      unique_order_number: "yes", // Adjust based on your logic
      payment_method: order.paymentMode === "COD" ? "COD" : "prepaid",
      consigner_name: "Your Company Name",
      consigner_phone: "Your Company Phone",
      consigner_pincode: "Your Warehouse Pincode",
      consigner_city: "Your Warehouse City",
      consigner_state: "Your Warehouse State",
      consigner_address: "Your Warehouse Address",
      consigner_gst_number: "Your GST Number",
      consignee_name: order.customerName,
      consignee_phone: order.mobile,
      consignee_pincode: order.pincode,
      consignee_city: order.city,
      consignee_state: order.state,
      consignee_address: order.address,
      consignee_gst_number: order.gstNumber || "",
      products: order.items.map((item: any) => ({
        product_name: item.productName,
        product_qty: item.quantity.toString(),
        product_price: item.orderValue.toString(),
        product_tax_per: "",
        product_sku: item.sku || "",
        product_hsn: item.hsn || "",
      })),
      invoice: [
        {
          invoice_number: `INV-${order.id}`,
          invoice_date: new Date().toISOString().split("T")[0],
          ebill_number: `EBILL-${order.id}`,
          ebill_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
        },
      ],
      weight: order.physicalWeight.toString(),
      breadth: order.breadth.toString(),
      length: order.length.toString(),
      height: order.height.toString(),
      courier_id: "01", // Adjust based on your courier mapping
      pickup_location: "franchise",
      shipping_charges: "40", // Replace with actual shipping charges
      cod_charges: order.paymentMode === "COD" ? "25" : "0", // Replace with actual COD charges
      discount: "0", // Replace with actual discount if applicable
      order_amount: order.items.reduce((sum: number, item: any) => sum + item.quantity * item.orderValue, 0).toString(),
      collectable_amount: order.paymentMode === "COD" ? order.codAmount.toString() : "0",
    };
  
    console.log("Xpressbees Payload:", payload);
  
    try {
      const response = await axios.post(process.env.XPRESSBEES_CREATE_SHIPMENT_API_URL!, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      console.log("Xpressbees Response:", response.data);
  
      if (response.data && response.data.response === true) {
        return response.data.awb_number;
      } else {
        console.error("Failed to fetch AWB from Xpressbees:", response.data.message);
        return null;
      }
    } catch (error: any) {
      console.error("Error in Xpressbees AWB generation:", error.response?.data || error.message);
      return null;
    }
  }

  let currentXpressbeesToken: string | null = null;
let tokenExpiryTime: number | null = null;
const TOKEN_BUFFER_SECONDS = 300;

async function getValidXpressbeesToken(): Promise<string | null> {
  const now = Date.now();
  if (currentXpressbeesToken && tokenExpiryTime && tokenExpiryTime - TOKEN_BUFFER_SECONDS * 1000 > now) {
    console.log("Using existing valid Xpressbees token.");
    return currentXpressbeesToken;
  }

  console.log("Fetching new Xpressbees token...");
  const response = await axios.post(process.env.XPRESSBEES_LOGIN_API_URL!, {
    email: process.env.XPRESSBEES_EMAIL!,
    password: process.env.XPRESSBEES_PASSWORD!,
  });

  if (response.data && response.data.status === true) {
    currentXpressbeesToken = response.data.data;
    tokenExpiryTime = Date.now() + 60 * 60 * 1000; // Token valid for 1 hour
    return currentXpressbeesToken;
  } else {
    console.error("Failed to fetch Xpressbees token:", response.data.message);
    return null;
  }
}