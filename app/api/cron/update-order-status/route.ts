import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";

type OrderStatus =
  | "manifested"
  | "pending_manifest"
  | "in_transit"
  | "out_for_delivery"
  | "undelivered"
  | "delivered"
  | "rto_delivered"
  | "rto_intransit"
  | "lost_shipment";
const TRACKING_STATUSES: OrderStatus[] = [
  "manifested",
  "pending_manifest",
  "in_transit",
  "out_for_delivery",
  "undelivered"
];


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

  return null;
}

function mapXpressbeesStatusToStandard(courierStatus?: string): string | null {
  if (!courierStatus) return null;

  const statusLower = courierStatus.toLowerCase();

  // Direct matches
  if (statusLower === "delivered" || statusLower === "dlvd")
    return "delivered";

  if (statusLower === "out for delivery" || statusLower === "ofd")
    return "out_for_delivery";

  if (statusLower.includes("in transit") ||
    statusLower === "intransit" ||
    statusLower === "it" ||
    statusLower === "rad")
    return "in_transit";

  if (statusLower.includes("rto delivered"))
    return "rto_delivered";

  if (statusLower.includes("rto") &&
    (statusLower.includes("initiated") || statusLower.includes("transit")))
    return "rto_intransit";

  if (statusLower.includes("undelivered") ||
    statusLower.includes("failed delivery"))
    return "undelivered";

  if (statusLower.includes("lost") || statusLower.includes("damaged"))
    return "lost_shipment";

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        status: { in: TRACKING_STATUSES },
        awbNumber: { not: null },
        courierName: { not: null }
      },
      include: {
        trackingHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1,
        }
      }
    });

    console.log(`Found ${orders.length} orders to check for status updates`);

    // Process orders in batches to avoid overwhelming courier APIs
    const batchSize = 5;
    const results: PromiseSettledResult<any>[] = [];

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);

      // Process each order in batch
      const batchResults = await Promise.allSettled(
        batch.map(async (order) => {
          try {
            if (!order.awbNumber || !order.courierName) {
              return { orderId: order.id, error: "Missing AWB or courier name" };
            }

            // Get tracking data from courier
            interface TrackingData {
              status?: string;
              description?: string;
              [key: string]: any;
            }
            let trackingData: TrackingData | null = null;
            let normalizedStatus = null;

            if (order.courierName.toLowerCase().includes("ecom express")) {
              trackingData = await ecomExpressClient.trackShipment(order.awbNumber) as TrackingData;
              normalizedStatus = mapEcomStatusToStandard(trackingData?.status);
            } else if (order.courierName.toLowerCase().includes("xpressbees")) {
              trackingData = await xpressbeesClient.trackShipment(order.awbNumber) as TrackingData;
              normalizedStatus = mapXpressbeesStatusToStandard(trackingData?.status);
            }

            if (!trackingData) {
              return { orderId: order.id, error: "Failed to fetch tracking data" };
            }

            // Update order if status has changed
            if (normalizedStatus && normalizedStatus !== order.status) {
              await prisma.$transaction([
                prisma.order.update({
                  where: { id: order.id },
                  data: {
                    status: normalizedStatus as any,
                    attempts: trackingData.attempts || order.attempts || 0,
                    ageing: Math.ceil((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                    shippingDetails: trackingData?.description || `Updated from ${order.status} to ${normalizedStatus}`
                  }
                }),
                prisma.orderTracking.create({
                  data: {
                    orderId: order.id,
                    status: trackingData?.status || "unknown",
                    normalizedStatus: normalizedStatus,
                    description: trackingData.description || "",
                    courier: order.courierName || "Unknown",
                    timestamp: new Date()
                  }
                })
              ]);

              return {
                orderId: order.id,
                awbNumber: order.awbNumber,
                previousStatus: order.status,
                newStatus: normalizedStatus,
                updated: true
              };
            }

            return {
              orderId: order.id,
              awbNumber: order.awbNumber,
              status: order.status,
              updated: false
            };
          } catch (error) {
            console.error(`Error updating order ${order.id}:`, error);
            return { orderId: order.id, error: error instanceof Error ? error.message : String(error) || "Unknown error" };
          }
        })
      );

      results.push(...batchResults);

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < orders.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Count successful updates
    const updatedOrders = results.filter(r =>
      r.status === "fulfilled" && r.value && r.value.updated
    ).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${orders.length} orders, updated ${updatedOrders} statuses`,
      timestamp: new Date().toISOString(),
      results: results.map(r => r.status === "fulfilled" ? r.value : { error: r.reason })
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process status updates", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}