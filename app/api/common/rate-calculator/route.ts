import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const rates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
  if (!rates) return NextResponse.json({ error: "Shipping rates not set" }, { status: 400 });

  const actualWeight = parseFloat(body.weight) || 0;
  const volumetricWeight =
    (parseFloat(body.length) * parseFloat(body.width) * parseFloat(body.height)) / 6000 || 0;
  const finalWeight = Math.max(actualWeight, volumetricWeight);
 
  let courierCharges = 0;
  if (rates.courierChargesType === "fixed") {
    courierCharges = finalWeight * rates.courierChargesAmount;
  } else { 
    courierCharges = parseFloat(body.declaredValue) * (rates.courierChargesAmount / 100);
  }
 
  let codCharges = 0;
  if (body.paymentMode === "COD") {
    if (rates.codChargesType === "fixed") {
      codCharges = rates.codChargesAmount;
    } else {
      codCharges = parseFloat(body.collectableValue) * (rates.codChargesAmount / 100);
    }
  }

  const totalPrice = courierCharges + codCharges;

  return NextResponse.json({
    rates: [
      {
        courierName: "DemoCourier",
        serviceType: "Standard",
        weight: finalWeight,
        courierCharges: Math.round(courierCharges * 100) / 100,
        codCharges: Math.round(codCharges * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
      },
    ],
  });
}