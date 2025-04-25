import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Call external courier API (e.g. Delhivery)
    const courierRes = await axios.post("https://api.delhivery.com/create_shipment", {
      // shipment details from data
      ...data
    }, {
      headers: { Authorization: `Bearer ${process.env.DELHIVERY_API_KEY}` }
    });

    // Extract info from courier response
    const courierName = courierRes.data.courier_name || "Delhivery";
    const trackingId = courierRes.data.awb_number;

    // Save order in your DB with courier info
    const order = await prisma.order.create({
      data: {
        ...data,
        courierName,
        trackingId,
      }
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order with courier" }, { status: 500 });
  }
}