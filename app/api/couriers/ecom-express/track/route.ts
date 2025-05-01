import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { prisma } from "@/lib/prisma";  
import { OrderStatus } from "@prisma/client"; 

interface TokenDetailsType {
  userId: number;
  exp: number;
}

function mapEcomStatusToSystem(ecomStatus: string): OrderStatus | null {
  const statusMap: Record<string, OrderStatus> = {
    'In Transit': OrderStatus.in_transit,
    'Out for Delivery': OrderStatus.out_for_delivery,
    'Delivered': OrderStatus.delivered,
    'Undelivered': OrderStatus.undelivered,
    'RTO In Transit': OrderStatus.rto_intransit,
    'RTO Delivered': OrderStatus.rto_delivered,
    'Lost': OrderStatus.lost_shipment,
    'Cancelled': OrderStatus.cancelled,  
    'Shipped': OrderStatus.shipped,  
  };
 
  const normalizedStatus = Object.keys(statusMap).find(key => key.toLowerCase() === ecomStatus.toLowerCase());
  return normalizedStatus ? statusMap[normalizedStatus] : null;
}


export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const { awbNumber } = await req.json();
    if (!awbNumber) {
      return NextResponse.json({ error: "AWB number is required" }, { status: 400 });
    }

    const trackingData = await ecomExpressClient.trackShipment(awbNumber);

    if (trackingData && trackingData.shipments && trackingData.shipments.length > 0) {
      const shipmentInfo = trackingData.shipments[0]; 

      const order = await prisma.order.findFirst({
        where: { awbNumber: awbNumber, userId: decoded.userId },
      });

      if (order) {
        const newStatus = mapEcomStatusToSystem(shipmentInfo.status);
        const updateData: any = { 
          ...(newStatus && newStatus !== order.status && { status: newStatus }), 
          ...(shipmentInfo.attempts && { attempts: parseInt(shipmentInfo.attempts) || order.attempts }),  
          ...(shipmentInfo.ageing && { ageing: parseInt(shipmentInfo.ageing) || order.ageing }),  
          ...(shipmentInfo.remarks && { remarks: shipmentInfo.remarks }),
          ...(shipmentInfo.billable_weight && { billableWeight: parseFloat(shipmentInfo.billable_weight) || order.billableWeight }),  
          ...(shipmentInfo.last_scan_date && shipmentInfo.last_scan_location && shipmentInfo.last_scan_remark && {
             shippingDetails: `${shipmentInfo.last_scan_remark} at ${shipmentInfo.last_scan_location} on ${shipmentInfo.last_scan_date}`
          }), 
        };

        if (Object.keys(updateData).length > 0) {
           await prisma.order.update({
             where: { id: order.id },
             data: updateData,
           });
           console.log(`Order ${order.id} (AWB: ${awbNumber}) updated with tracking info:`, updateData);
        }

      } else {
        console.warn(`Order with AWB ${awbNumber} not found for user ${decoded.userId}`);
      }
    } else {
       console.log(`No valid tracking data received for AWB ${awbNumber}`);
    } 

    return NextResponse.json({ tracking: trackingData });

  } catch (error: any) {
    console.error("Tracking error:", error); 
    if (error.response) {
      console.error("API Response Error:", error.response.data);
      return NextResponse.json({ error: "Failed to fetch tracking information from Ecom Express", details: error.response.data }, { status: error.response.status || 500 });
    }
    return NextResponse.json({ error: "Failed to fetch tracking information" }, { status: 500 });
  }
}