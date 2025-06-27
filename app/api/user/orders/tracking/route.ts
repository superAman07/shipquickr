import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";

interface TokenDetailsType {
  userId: number;
  email: string;
  exp: number;
}
interface TrackingResponse {
  awbNumber?: string;
  status?: string;
  description?: string;
  location?: string;
  date?: string;
  delivered?: boolean;
  history?: any[];
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
    console.log("Token done from tracking...")

    const { awbNumber, courierName } = await req.json();

    console.log("Awb numebr and courier name: ", awbNumber, courierName);

    if (!awbNumber || !courierName) {
      return NextResponse.json({ error: "Missing required fields: awbNumber, courierName" }, { status: 400 });
    }

    let trackingData: TrackingResponse | null = null;
    let normalizedStatus = null;

    // Get tracking data from courier
    if (courierName.toLowerCase().includes("ecom express")) {
      trackingData = await ecomExpressClient.trackShipment(awbNumber) as TrackingResponse;
      normalizedStatus = mapEcomStatusToStandard(trackingData?.status);
    } else if (courierName.toLowerCase().includes("xpressbees")) {
      trackingData = await xpressbeesClient.trackShipment(awbNumber);
      normalizedStatus = mapXpressbeesStatusToStandard(trackingData?.status);
    } else {
      return NextResponse.json({ error: "Unsupported courier for tracking" }, { status: 400 });
    }

    if (!trackingData) {
      return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 503 });
    }

    // Update order status in database if we got a valid normalized status
    const order = await prisma.order.findFirst({
      where: { awbNumber: awbNumber }
    });
     
    if (normalizedStatus && order && normalizedStatus !== order.status) {
      await prisma.$transaction([
        // Update the main order status
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: normalizedStatus as any,
            shippingDetails: trackingData?.description || `Updated from ${order.status} to ${normalizedStatus}`
          }
        }),

        // Create a tracking history entry
        prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: trackingData?.status || "unknown",
            normalizedStatus: normalizedStatus,
            description: trackingData?.description || "",
            courier: courierName || "Unknown",
            timestamp: new Date()
          }
        })
      ]);
      console.log(`Status updated for AWB ${awbNumber}: ${order.status} → ${normalizedStatus}`);
    } else if (order) {
      console.log(`No status change needed for AWB ${awbNumber}: ${order.status}`);
    } else {
      console.log(`No order found with AWB: ${awbNumber}`);
    }

    return NextResponse.json({
      success: true,
      message: normalizedStatus ? "Order status updated successfully" : "Tracking information retrieved",
      tracking: trackingData,
      normalizedStatus: normalizedStatus,
      previousStatus: order?.status, // Add this to show what status changed from
      orderFound: !!order
    });

  } catch (error: any) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track order: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}

// Map courier-specific statuses to your standard statuses
function mapEcomStatusToStandard(courierStatus?: string): string | null {
  if (!courierStatus) return null;

  const statusLower = courierStatus.toLowerCase();
  if (statusLower.includes("delivered")) return "delivered";
  if (statusLower.includes("out for delivery")) return "out_for_delivery";
  if (statusLower.includes("in transit")) return "in_transit";
  if (statusLower.includes("rto") && statusLower.includes("delivered")) return "rto_delivered";
  if (statusLower.includes("rto") && statusLower.includes("transit")) return "rto_intransit";
  if (statusLower.includes("undelivered")) return "undelivered";
  if (statusLower.includes("lost") || statusLower.includes("damaged")) return "lost_shipment";

  return null; // No mapping found, keep existing status
}

function mapXpressbeesStatusToStandard(courierStatus?: string): string | null {
  if (!courierStatus) return null;

  const statusLower = courierStatus.toLowerCase();

  // Direct matches
  if (statusLower === "delivered" || statusLower === "dlvd")
    return "delivered";

  if (statusLower === "out for delivery" || statusLower === "ofd")
    return "out_for_delivery";

  // In-transit related statuses  
  if (statusLower.includes("in transit") ||
    statusLower === "intransit" ||
    statusLower === "it" ||
    statusLower === "reached at destination" ||
    statusLower === "rad" ||
    statusLower === "pickdone" ||
    statusLower === "pud")
    return "in_transit";

  // RTO statuses
  if (statusLower.includes("rto delivered") || statusLower === "rtod")
    return "rto_delivered";

  if (statusLower.includes("rto") &&
    (statusLower.includes("initiated") || statusLower.includes("transit") || statusLower.includes("pending")))
    return "rto_intransit";

  // Failed delivery attempts
  if (statusLower.includes("undelivered") ||
    statusLower.includes("failed delivery") ||
    statusLower === "df" ||
    statusLower === "delivery failed")
    return "undelivered";

  // Lost or damaged
  if (statusLower.includes("lost") ||
    statusLower.includes("damaged") ||
    statusLower.includes("destroyed"))
    return "lost_shipment";

  // Pending pickup
  if (statusLower.includes("pending pickup") ||
    statusLower === "pending" ||
    statusLower === "drc")
    return "pending_manifest";

  return null; // No mapping found
}