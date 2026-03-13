import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to fire generic webhooks to Merchants
async function forwardWebhookToMerchant(url: string, payload: any) {
    if (!url || url === "null" || url.trim() === "") return;
    try {
        new URL(url); // Validate URL format
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.log(`Forwarded status webhook to merchant ${url}`);
    } catch (err) {
        console.error(`Failed to forward status webhook to merchant ${url}:`, err);
    }
}

// Map Delhivery's chaotic statuses to Shipquickr's clean statuses
function mapDelhiveryStatusToStandard(delhiveryStatus: string) {
    const s = delhiveryStatus.toLowerCase();
    if (s.includes("delivered")) return "delivered";
    if (s.includes("rto") || s.includes("returned")) return "rto";
    if (s.includes("pickup") || s.includes("manifest")) return "manifested";
    if (s.includes("transit") || s.includes("dispatched") || s.includes("connected")) return "in_transit";
    if (s.includes("out for delivery")) return "out_for_delivery";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("lost") || s.includes("damaged") || s.includes("destroyed")) return "lost";
    return "unshipped"; // Default fallback
}

export async function POST(req: NextRequest) {
    try {
        // Delhivery sends the payload as JSON.
        // It's an array of objects for multiple packages, or a single object.
        const bodyText = await req.text();
        console.log("RAW DELHIiVERY WEBHOOK PAYLOAD:", bodyText);
        
        const payload = JSON.parse(bodyText);
        
        // Sometimes Delhivery sends a single object, sometimes an array. Normalize it.
        const updates = Array.isArray(payload) ? payload : [payload];

        for (const update of updates) {
            const waybill = update.Waybill || update.waybill;
            const newDelhiveryStatus = update.Status?.Status || update.status || update.StatusType || "Unknown";
            const location = update.Status?.Location || update.ScannedLocation || "";
            const scanDateStr = update.Status?.StatusDateTime || update.ScanDateTime;
            
            if (!waybill) continue;

            // 1. Find the order in Shipquickr DB using the AWB
            const order = await prisma.order.findFirst({
                where: { awbNumber: waybill },
                include: { user: true } // Include user to get their personal Webhook URL
            });

            if (!order) {
                console.log(`Webhook Received: Waybill ${waybill} not found in our DB. Ignored.`);
                continue;
            }

            // 2. Map standard status
            const mappedStandardStatus = mapDelhiveryStatusToStandard(newDelhiveryStatus);

            // 3. Update the Order
            await prisma.order.update({
                where: { id: order.id },
                data: { status: mappedStandardStatus as any } // as any to ignore strict Prisma enum if needed
            });

            // 4. Log the step in the Tracking History Table
            await prisma.orderTracking.create({
                data: {
                    orderId: order.id,
                    status: newDelhiveryStatus,
                    normalizedStatus: mappedStandardStatus,
                    description: `Package scanned at ${location}`,
                    courier: "Delhivery",
                    timestamp: scanDateStr ? new Date(scanDateStr) : new Date()
                }
            });

            // 5. Instantly forward to CelsiusPop (If they registered a webhook in your API Settings)
            if (order.user.webhookUrl) {
                const forwardPayload = {
                    event: "order_status_update",
                    orderId: order.orderId,
                    awb: waybill,
                    status: mappedStandardStatus,
                    rawStatus: newDelhiveryStatus,
                    location: location,
                    timestamp: new Date().toISOString()
                };
                
                // Fire and forget
                forwardWebhookToMerchant(order.user.webhookUrl, forwardPayload);
            }
        }

        return NextResponse.json({ success: true, message: "Webhook processed" }, { status: 200 });

    } catch (error: any) {
        console.error("Delhivery Webhook Crash:", error);
        return NextResponse.json({ error: "Internal Server Error Processing Webhook" }, { status: 500 });
    }
}
