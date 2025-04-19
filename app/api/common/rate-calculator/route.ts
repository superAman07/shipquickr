// import { NextRequest, NextResponse } from "next/server";
// import axios from "axios";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     // Yahan aapko LRN generate ya fetch karna hoga, abhi ke liye ek static LRN use kar rahe hain
//     const lrns = "220029522"; // Replace with dynamic LRN if available

//     const options = {
//       method: "GET",
//       url: `https://ltl-clients-api-dev.delhivery.com/lrn/freight-breakup/lrns=${encodeURIComponent(lrns)}`,
//       headers: {
//         Authorization: `Bearer ${process.env.DELHIVERY_API_TOKEN}`,
//       },
//     };

//     const delhiveryRes = await axios.request(options);

//     // Response ko apne frontend ke format me convert karo
//     // Yahan response structure Delhivery docs ke hisaab se adjust karo
//     const rateData = delhiveryRes.data[0]; // Assuming response is an array

//     return NextResponse.json({
//       rates: [
//         {
//           courierName: "Delhivery",
//           serviceType: "Standard",
//           weight: body.weight,
//           courierCharges: rateData?.freight_charge || 0,
//           codCharges: body.paymentMode === "COD" ? 25 : 0,
//           totalPrice: (rateData?.freight_charge || 0) + (body.paymentMode === "COD" ? 25 : 0),
//         },
//       ],
//     });
//   } catch (err: any) {
//     return NextResponse.json({ rates: [], error: "Failed to fetch rates" }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Dummy calculation logic
    const weight = parseFloat(body.weight) || 0;
    const declaredValue = parseFloat(body.declaredValue) || 0;
    const codCharges = body.paymentMode === "COD" ? 25 : 0;

    // Example: base rate + weight * 10 + declared value * 0.01
    const courierCharges = 50 + weight * 10 + declaredValue * 0.01;
    const totalPrice = courierCharges + codCharges;

    return NextResponse.json({
      rates: [
        {
          courierName: "DemoCourier",
          serviceType: "Standard",
          weight: weight,
          courierCharges: courierCharges,
          codCharges: codCharges,
          totalPrice: totalPrice,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ rates: [], error: "Failed to calculate rates" }, { status: 500 });
  }
}