import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { delhiveryClient } from "@/lib/services/delhivery";
import { forwardWebhookToMerchant } from "@/lib/webhook";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { shadowfaxClient } from "@/lib/services/shadowfax";

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




// // export const runtime = 'nodejs';
// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { jwtDecode } from "jwt-decode";
// import { prisma } from "@/lib/prisma";
// import { ecomExpressClient } from "@/lib/services/ecom-express";
// import { xpressbeesClient } from "@/lib/services/xpressbees";
// import { S3Client } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";

// interface TokenDetailsType {
//   userId: number;
//   email: string;
//   exp: number;
// }

// interface SelectedCourier {
//   name: string;
//   rate: number;
//   codCharges: number;
//   totalPrice: number;
//   serviceType?: string;
//   weight: number;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("userToken")?.value;
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const decoded = jwtDecode<TokenDetailsType>(token);
//     if (decoded.exp * 1000 < Date.now()) {
//       return NextResponse.json({ error: "Token expired" }, { status: 401 });
//     }
//     const userId = decoded.userId;

//     const body = await req.json();
//     const { orderId, selectedCourier }: { orderId: number; selectedCourier: SelectedCourier } = body;

//     if (!orderId || !selectedCourier || !selectedCourier.name || selectedCourier.totalPrice == null || isNaN(selectedCourier.totalPrice)) {
//       return NextResponse.json({ error: "Missing orderId or valid selectedCourier details (name, totalPrice)" }, { status: 400 });
//     }

//     console.log(`Simplified Shipment Confirmation Request for Order ID: ${orderId}, User ID: ${userId}, Courier: ${selectedCourier.name}`);

//     const order = await prisma.order.findUnique({
//       where: { id: orderId, userId: userId },
//       include: { items: true, warehouse: true },
//     });
//     if (!order) {
//       return NextResponse.json({ error: "Order not found or does not belong to user." }, { status: 404 });
//     }

//     const kycDetail = await prisma.kycDetail.findUnique({
//       where: { userId: order.userId },
//       select: { gstNumber: true }
//     });

//     if (!order.warehouse) {
//       console.error(`Order ID ${order.id} is missing warehouse information, which is required for consigner details.`);
//       return NextResponse.json({ error: "Order is missing critical warehouse (pickup location) information." }, { status: 400 });
//     }

//     if (order.status !== "unshipped") {
//       return NextResponse.json({ error: `Order status is already '${order.status}'. Cannot process again.` }, { status: 400 });
//     }

//     if (!order.warehouseId) {
//       console.warn(`Order ID ${order.id} has no warehouseId. This might be an issue for future manifest.`);
//     }

//     let actualAwbNumber: string | null = null;
//     let shippingId: string | null = null;
//     let labelUrl: string | null = null;

//     if (selectedCourier.name === "Ecom Express") {
//       console.log("Attempting to fetch AWB from Ecom Express (using temporary function)...");

//       actualAwbNumber = await ecomExpressClient.fetchAwbNumber(order.paymentMode as "COD" | "Prepaid");
//       if (!actualAwbNumber) {
//         console.error("Failed to fetch AWB number from Ecom Express using temporary function.");
//         return NextResponse.json({ error: "Failed to obtain AWB from Ecom Express. Please check API logs/config." }, { status: 503 });
//       }
//       console.log("Successfully fetched AWB from Ecom Express (temporary function):", actualAwbNumber);
      
//       const manifestSuccess = await ecomExpressClient.createManifest(actualAwbNumber, { ...order, kycDetail });
//       if (!manifestSuccess) {
//         console.error("Manifest creation failed for Ecom Express AWB:", actualAwbNumber);
//         return NextResponse.json({ error: "Manifest creation failed for Ecom Express. Please check API logs/balance." }, { status: 503 });
//       }
//       console.log("Waiting for Ecom Express to process the AWB...");
//       await new Promise(resolve => setTimeout(resolve, 8000));
//       if (actualAwbNumber) { 

//         console.log("Generating Ecom Express label for AWB:", actualAwbNumber);
//         const labelDataUri = await ecomExpressClient.generateShippingLabel([actualAwbNumber]);

//         if (labelDataUri) { 
//           try {
//             const s3Client = new S3Client({});
//             const pdfBuffer = Buffer.from(labelDataUri.split(',')[1], 'base64');
//             const filename = `labels/${Date.now()}-ecom-${actualAwbNumber}.pdf`;

//             const upload = new Upload({
//               client: s3Client,
//               params: {
//                 Bucket: process.env.S3_UPLOAD_BUCKET_NAME!,
//                 Key: filename,
//                 Body: pdfBuffer,
//                 ContentType: 'application/pdf',
//                 ACL: 'public-read',
//               },
//             });

//             await upload.done();
//             labelUrl = `https://${process.env.S3_UPLOAD_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${filename}`;
//             console.log("Ecom Express label uploaded to S3:", labelUrl);
//           } catch (error) {
//             console.error("Failed to upload Ecom Express label to S3:", error);
//             // Don't fail the whole process if label upload fails
//             // User can still generate label later
//           }
//         }
        
//       }
//     } else if (selectedCourier.name === "Xpressbees") {
//       console.log("Attempting to fetch AWB from Xpressbees...");
//       const shipmentDetails = await xpressbeesClient.generateAwb(order, selectedCourier.serviceType, kycDetail?.gstNumber);

//       if (!shipmentDetails) {
//         return NextResponse.json({ error: "Failed to obtain AWB from Xpressbees." }, { status: 503 });
//       }

//       actualAwbNumber = shipmentDetails.awbNumber;
//       shippingId = shipmentDetails.shippingId;
//       labelUrl = shipmentDetails.labelUrl;
//       const manifestSuccess = await xpressbeesClient.createManifest([actualAwbNumber]);
//       if (!manifestSuccess) {
//         console.error("Manifest creation failed for Xpressbees AWB:", actualAwbNumber);
//       }
//     } else {
//       console.warn(`No specific AWB fetch logic for ${selectedCourier.name}. Using generic placeholder.`);
//       actualAwbNumber = `GENERIC-DUMMY-${orderId}-${Date.now().toString().slice(-6)}`;
//     }

//     if (!actualAwbNumber) {
//       console.error(`AWB Number could not be determined for courier: ${selectedCourier.name}`);
//       return NextResponse.json({ error: `Could not determine AWB number for ${selectedCourier.name}.` }, { status: 500 });
//     }

//     const dbTransactionResult = await prisma.$transaction(async (tx) => {
//       const baseShippingCost = selectedCourier.totalPrice;
//       const gstRate = 0.18;
//       const finalShippingCost = baseShippingCost * (1 + gstRate);

//       let updatedWalletBalance: number | undefined = undefined;

//       if (order.paymentMode === "Prepaid" || order.paymentMode === "COD") {
//         const wallet = await tx.wallet.findUnique({ where: { userId: userId } });
//         const currentBalance = wallet?.balance ?? 0;
//         if (currentBalance < finalShippingCost) {
//           return { success: false, error: `Insufficient wallet balance. Required: ₹${finalShippingCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`, status: 402 };
//         }
//         const updatedWallet = await tx.wallet.update({
//           where: { userId: userId },
//           data: { balance: { decrement: finalShippingCost } },
//         });
//         updatedWalletBalance = updatedWallet.balance;
//         await tx.transaction.create({
//           data: {
//             userId: userId,
//             amount: finalShippingCost,
//             type: "debit",
//             status: "Success",
//             orderId: order.id,
//           },
//         });
//       }

//       const isManifested = selectedCourier.name === "Ecom Express" || selectedCourier.name === "Xpressbees";
//       const newStatus = isManifested ? "manifested" : "pending_manifest";

//       await tx.order.update({
//         where: { id: order.id },
//         data: {
//           status: newStatus,
//           awbNumber: actualAwbNumber,
//           shippingId: shippingId,
//           labelUrl: labelUrl,
//           courierName: selectedCourier.name,
//           shippingCost: finalShippingCost,
//           billableWeight: selectedCourier.weight,
//           shippingDetails: selectedCourier.name === "Ecom Express"
//             ? `AWB ${actualAwbNumber} assigned and manifested with Ecom Express.`
//             : `AWB ${actualAwbNumber} assigned. Pending manifest creation.`,
//         },
//       });

//       return {
//         success: true,
//         orderIdFromDb: order.id,
//         orderSystemId: order.orderId,
//         awbAssigned: actualAwbNumber,
//         updatedWalletBalance: updatedWalletBalance,
//         finalStatus: newStatus
//       };
//     });

//     if (!dbTransactionResult || !dbTransactionResult.success) {
//       return NextResponse.json({ error: dbTransactionResult.error || "Database transaction failed" }, { status: (dbTransactionResult as any).status || 500 });
//     }

//     return NextResponse.json({
//       success: true,
//       message: `Order ID ${dbTransactionResult.orderSystemId} processed. AWB ${dbTransactionResult.awbAssigned} assigned. Status: ${dbTransactionResult.finalStatus}`,
//       orderId: dbTransactionResult.orderIdFromDb,
//       awbNumber: dbTransactionResult.awbAssigned,
//       courierName: selectedCourier.name,
//       newBalance: dbTransactionResult.updatedWalletBalance,
//       orderStatus: dbTransactionResult.finalStatus
//     });

//   } catch (error: any) {
//     console.error("Shipment Confirmation Error (Simplified Flow):", error);
//     let errorMessage = "Failed to process shipment due to an unexpected error.";
//     let errorStatus = 500;

//     if (error.message?.includes("Insufficient wallet balance")) {
//       errorMessage = error.message;
//       errorStatus = 402;
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
//     if (error.code && typeof error.code === 'string' && error.code.startsWith('P')) { // Prisma error
//       console.error("Prisma Error in Shipment Confirmation:", error.code, error.message);
//       errorMessage = "A database error occurred while processing your shipment.";
//     }
//     return NextResponse.json({ success: false, error: errorMessage }, { status: errorStatus });
//   }
// }