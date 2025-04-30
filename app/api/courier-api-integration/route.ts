import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const courierRes = await axios.post("https://api.delhivery.com/create_shipment", {
      ...data
    }, {
      headers: { Authorization: `Bearer ${process.env.DELHIVERY_API_KEY}` }
    });

    const courierName = courierRes.data.courier_name || "Delhivery";
    const trackingId = courierRes.data.awb_number;

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