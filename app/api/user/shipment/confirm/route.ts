import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { delhiveryClient } from "@/lib/services/delhivery";
import { forwardWebhookToMerchant } from "@/lib/webhook";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { shadowfaxClient } from "@/lib/services/shadowfax";
import { ekartClient } from "@/lib/services/ekart";

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
  serviceType?: string;
  weight: number;
  courierPartnerId?: number;
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

    console.log(`Shipment Confirmation Request - Order: ${orderId}, User: ${userId}, Courier: ${selectedCourier.name}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId },
      include: { items: true, warehouse: true, user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or does not belong to user." }, { status: 404 });
    }

    if (!order.warehouse) {
      return NextResponse.json({ error: "Order is missing pickup location (warehouse) information." }, { status: 400 });
    }

        if (order.status !== "unshipped") {
      return NextResponse.json({ error: `Order status is already '${order.status}'. Cannot process again.` }, { status: 400 });
    }

    // --- COURIER ASSIGNMENT SECURITY CHECK ---
    const assignments = await prisma.userCourierAssignment.findMany({
      where: { userId: userId, isActive: true },
      select: { courier: true }
    });
    
    if (assignments.length > 0) {
      const assignedCourierNames = assignments.map(a => a.courier.toLowerCase());
      const courierNameLower = selectedCourier.name.toLowerCase();
      
      const isAllowed = 
        assignedCourierNames.includes(courierNameLower) ||
        (courierNameLower.includes("xpressbees") && assignedCourierNames.some(c => c.includes("xpress") || c.includes("express"))) ||
        (courierNameLower.includes("delhivery") && assignedCourierNames.some(c => c.includes("delhivery"))) ||
        (courierNameLower.includes("shadowfax") && assignedCourierNames.some(c => c.includes("shadowfax") || c.includes("shadow fax"))) ||
        (courierNameLower.includes("ecom") && assignedCourierNames.some(c => c.includes("ecom"))) ||
        assignedCourierNames.some(c => courierNameLower.includes(c));

      if (!isAllowed) {
        return NextResponse.json({ 
            error: `Unauthorized: You do not have permission to use ${selectedCourier.name}. Please contact support.` 
        }, { status: 403 });
      }
    }

    let actualAwbNumber = "";
    let finalCourierName = selectedCourier.name;
    let labelUrl = "";
        // A. Check if user selected Delhivery Direct
    if (selectedCourier.name.toLowerCase().includes("delhivery")) {
        console.log(`Processing Order ${orderId} via Delhivery Direct integration...`);
        const mode = selectedCourier.name.toLowerCase().includes("express") ? "Express" : "Surface";
        const bookingResult = await delhiveryClient.createOrder(order, mode);
        
        if (!bookingResult) {
             return NextResponse.json({ error: "Failed to connect to Delhivery. Please try again." }, { status: 502 });
        }
        if ('error' in bookingResult) {
            const delhiveryError = (bookingResult as any).error;
            let userMessage = `Delhivery: ${delhiveryError}`;
            if (delhiveryError.includes("ClientWarehouse matching query does not exist")) {
                userMessage = `Pickup location "${order.warehouse?.warehouseName}" is not registered in Delhivery. Please ensure the warehouse name in ShipQuickr exactly matches the one registered in your Delhivery portal.`;
            }
            return NextResponse.json({ error: userMessage }, { status: 502 });
        }
        if (!bookingResult.waybill) {
             return NextResponse.json({ error: "Delhivery did not return a tracking number. Please try again or contact support." }, { status: 502 });
        }
        
        actualAwbNumber = bookingResult.waybill;
        finalCourierName = "Delhivery " + mode;
        console.log("Delhivery Direct Booking Success. AWB:", actualAwbNumber);
        
        const labelResult = await delhiveryClient.generateLabel(actualAwbNumber);
        if (labelResult.success && labelResult.url) { labelUrl = labelResult.url; }
    } 
    // B. Check if user selected Xpressbees
    else if (selectedCourier.name.toLowerCase().includes("xpressbees")) {
        console.log(`Processing Order ${orderId} via Xpressbees Direct integration...`);
        
        // Fetch KYC for Xpressbees GST requirements
        const kycDetail = await prisma.kycDetail.findUnique({
             where: { userId: order.userId },
             select: { gstNumber: true }
        });
        
        const shipmentDetails = await xpressbeesClient.generateAwb(order, selectedCourier.serviceType, kycDetail?.gstNumber);

        if (!shipmentDetails) {
            return NextResponse.json({ error: "Failed to connect to Xpressbees API." }, { status: 502 });
        }
        if (shipmentDetails.error) {
            return NextResponse.json({ error: `Xpressbees: ${shipmentDetails.error}` }, { status: 502 });
        }
        if (!shipmentDetails.awbNumber) {
            return NextResponse.json({ error: "Failed to book order with Xpressbees. No tracking number returned." }, { status: 502 });
        }
        
        actualAwbNumber = shipmentDetails.awbNumber;
        finalCourierName = selectedCourier.name;
        labelUrl = shipmentDetails.labelUrl || "";
        console.log("Xpressbees Booking Success. AWB:", actualAwbNumber);
        
        // Trigger background manifest creation silently
        await xpressbeesClient.createManifest([actualAwbNumber]).catch(e => console.error("Xpressbees background manifest failed:", e));
    }
    // C. Check if user selected Shadowfax
    else if (selectedCourier.name.toLowerCase().includes("shadowfax")) {
        console.log(`Processing Order ${orderId} via Shadowfax Direct integration...`);
        const shipmentDetails = await shadowfaxClient.generateAwb(order, selectedCourier.serviceType);
        
        if (!shipmentDetails || !shipmentDetails.awbNumber) {
             return NextResponse.json({ error: "Failed to book order with Shadowfax." }, { status: 502 });
        }
        
        actualAwbNumber = shipmentDetails.awbNumber;
        finalCourierName = selectedCourier.name;
        labelUrl = shipmentDetails.labelUrl || "";
        console.log("Shadowfax Booking Success. AWB:", actualAwbNumber);
    }
    else if (selectedCourier.name.toLowerCase().includes("ekart")) {
        console.log(`Processing Order ${orderId} via EKart Direct integration...`);
        
        // Fetch KYC for EKart GST requirements (same pattern as Xpressbees)
        const kycDetail = await prisma.kycDetail.findUnique({
            where: { userId: order.userId },
            select: { gstNumber: true }
        });
        
        const shipmentDetails = await ekartClient.createShipment(order, kycDetail?.gstNumber);
        if (!shipmentDetails) {
            return NextResponse.json({ error: "Failed to connect to EKart API." }, { status: 502 });
        }
        if ('error' in shipmentDetails) {
            return NextResponse.json({ error: `EKart: ${shipmentDetails.error}` }, { status: 502 });
        }
        
        actualAwbNumber = shipmentDetails.awbNumber;
        finalCourierName = selectedCourier.name;
        // Note: Label will be generated on-demand later via the track/label API we added in ekart.ts
        console.log("EKart Booking Success. AWB:", actualAwbNumber);
    }
    // D. Aggregator Fallback (Any other courier logic)
    else {
        const warehouseId = process.env.SHIPPING_AGGREGATOR_WAREHOUSE_ID;
        if (!warehouseId) {
            return NextResponse.json({ error: "Server configuration error: Warehouse ID missing." }, { status: 500 });
        }
        const aggregatorOrderId = await shippingAggregatorClient.pushOrder(order, warehouseId);
        if (!aggregatorOrderId) {
            return NextResponse.json({ error: "Failed to push order to shipping provider." }, { status: 502 });
        }
        
        const assignResult = await shippingAggregatorClient.assignCourier(aggregatorOrderId as string, selectedCourier.courierPartnerId!);
        if (!assignResult.success) {
            return NextResponse.json({ error: "Failed to assign courier. Pincode might not be serviceable." }, { status: 502 });
        }
        actualAwbNumber = assignResult.awb || order.orderId; 
        finalCourierName = assignResult.courierName || selectedCourier.name;
    }
    const courierName = finalCourierName;

    const dbTransactionResult = await prisma.$transaction(async (tx) => {
      const finalShippingCost = selectedCourier.totalPrice; 

      let updatedWalletBalance: number | undefined = undefined;

      if (order.paymentMode === "Prepaid" || order.paymentMode === "COD") {
        const wallet = await tx.wallet.findUnique({ where: { userId: userId } });
        const currentBalance = wallet?.balance ?? 0;
        
        if (currentBalance < finalShippingCost) {
          throw new Error(`Insufficient wallet balance. Required: ₹${finalShippingCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`);
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
          status: "manifested",
          awbNumber: actualAwbNumber,
          labelUrl: labelUrl || null,
          courierName: courierName,
          shippingCost: finalShippingCost,
          billableWeight: selectedCourier.weight,
          shippingDetails: `Booked via Shipmozo. Courier: ${courierName}`,
        },
      });

      return {
        success: true,
        orderIdFromDb: order.id,
        orderSystemId: order.orderId,
        awbAssigned: actualAwbNumber,
        updatedWalletBalance: updatedWalletBalance,
        finalStatus: "manifested"
      };
    });

    if (order.user?.webhookUrl && dbTransactionResult.awbAssigned) {
      // Fire and forget webhook to merchant immediately upon successful manual manifestation
      forwardWebhookToMerchant(order.user.webhookUrl, {
          event: "order_status_update",
          orderId: order.orderId,
          awb: dbTransactionResult.awbAssigned,
          status: dbTransactionResult.finalStatus,
          rawStatus: "Manifested",
          location: "ShipQuickr System",
          timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order processed successfully! AWB: ${dbTransactionResult.awbAssigned}`,
      orderId: dbTransactionResult.orderIdFromDb,
      awbNumber: dbTransactionResult.awbAssigned,
      courierName: courierName,
      newBalance: dbTransactionResult.updatedWalletBalance,
      orderStatus: dbTransactionResult.finalStatus
    });

  } catch (error: any) {
    console.error("Shipment Confirmation Error:", error);
    
    let errorMessage = "Failed to process shipment due to an unexpected error.";
    let errorStatus = 500;
    if (error.message?.includes("Insufficient wallet balance")) {
      errorMessage = error.message;
      errorStatus = 402; 
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: errorStatus });
  }
}