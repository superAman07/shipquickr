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


// import { NextRequest, NextResponse } from "next/server";
// import axios from "axios";
// import { URLSearchParams } from "url";

// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const l = parseFloat(body.length) || 0;
//   const w = parseFloat(body.width)  || 0;
//   const h = parseFloat(body.height) || 0;
//   const actual = parseFloat(body.weight) || 0;
//   const volumetric = (l * w * h) / 5000;
//   const cw = Math.max(actual, volumetric, 1); 

//   const shipment = {
//     orginPincode: body.pickupPincode,
//     destinationPincode: body.destinationPincode,
//     productType: body.paymentMode === "COD" ? "cod" : "ppd",
//     chargeableWeight: cw,
//     codAmount: body.paymentMode === "COD" 
//       ? parseFloat(body.collectableValue) || 0 
//       : undefined
//   };

//   const formData = new URLSearchParams();
//   formData.append("username", process.env.ECOM_EXPRESS_USERNAME || "");
//   formData.append("password", process.env.ECOM_EXPRESS_PASSWORD || "");
//   formData.append("json_input", JSON.stringify([shipment]));

//   try {
//     const { data } = await axios.post(
//       process.env.ECOM_EXPRESS_RATE_API_URL || "",
//       formData
//     );
//     if (Array.isArray(data)) {
//       const rates = data.map((r: any) => ({
//         courierName: "Ecom Express",
//         weight: cw,
//         courierCharges: parseFloat(r.FRT)    || 0,
//         codCharges:     parseFloat(r.COD)    || 0,
//         totalPrice:     parseFloat(r.total_charge) || 0,
//       }));
//       return NextResponse.json({ rates });
//     }
//     return NextResponse.json({ error: data }, { status: 400 });
//   } catch (e: any) {
//     console.error("Ecom Error:", e.response?.data || e.message);
//     return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
//   }
// }