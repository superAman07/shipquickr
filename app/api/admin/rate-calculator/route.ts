import { NextRequest, NextResponse } from "next/server";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { delhiveryClient } from "@/lib/services/delhivery";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { shadowfaxClient } from "@/lib/services/shadowfax";
import { ekartClient } from "@/lib/services/ekart";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requiredFields = ['pickupPincode', 'destinationPincode', 'weight', 'length', 'width', 'height', 'paymentMode'];
    const missingFields = requiredFields.filter(field => !(field in body) || !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const l = parseFloat(body.length) || 1;
    const w = parseFloat(body.width) || 1;
    const h = parseFloat(body.height) || 1;
    const actual = parseFloat(body.weight) || 0.01;
    const volumetric = (l * w * h) / 5000;
    const cw = Math.max(actual, volumetric, 0.5);

    const dimensions = { length: l, width: w, height: h };
    const declaredValue = parseFloat(body.declaredValue) || 50;
    const codAmount = body.paymentMode === "COD" ? (parseFloat(body.collectableValue) || 0) : 0;

    // Call the new Aggregator Service
    // Call both Aggregator and Delhivery, Xpressbees, Shadowfax
    const [rawRatesResult, delhiverySurfaceResult, delhiveryExpressResult, xpressbeesResult, ekartResult] = await Promise.allSettled([
      shippingAggregatorClient.fetchRatesStandard(
        body.pickupPincode,
        body.destinationPincode,
        cw,
        dimensions,
        body.paymentMode,
        declaredValue,
        codAmount
      ),
      delhiveryClient.fetchRate(
        String(body.pickupPincode),
        String(body.destinationPincode),
        cw,
        "Surface",
        body.paymentMode,
        declaredValue
      ),
      delhiveryClient.fetchRate(
        String(body.pickupPincode),
        String(body.destinationPincode),
        cw,
        "Express",
        body.paymentMode,
        declaredValue
      ),
      xpressbeesClient.getXpressbeesOptions(
        { originPincode: body.pickupPincode, destinationPincode: body.destinationPincode, productType: body.paymentMode === "COD" ? "cod" : "ppd", codAmount, declaredValue },
        cw,
        { l: dimensions.length, w: dimensions.width, h: dimensions.height }
      ),
      ekartClient.getEkartOptions(
        { originPincode: body.pickupPincode, destinationPincode: body.destinationPincode, productType: body.paymentMode === "COD" ? "cod" : "ppd", codAmount, declaredValue },
        cw,
        { l: dimensions.length, w: dimensions.width, h: dimensions.height }
      )
    ]);

    let combinedRates = rawRatesResult.status === "fulfilled" ? (rawRatesResult.value || []) : [];
    if (delhiverySurfaceResult.status === "fulfilled" && delhiverySurfaceResult.value) combinedRates.push(delhiverySurfaceResult.value);
    if (delhiveryExpressResult.status === "fulfilled" && delhiveryExpressResult.value) combinedRates.push(delhiveryExpressResult.value);
    if (xpressbeesResult.status === "fulfilled" && xpressbeesResult.value) combinedRates.push(...xpressbeesResult.value);
    if (ekartResult.status === "fulfilled" && ekartResult.value) {
      combinedRates.push(ekartResult.value);
    }

    if (combinedRates.length === 0) {
      return NextResponse.json({ error: "No shipping rates found for the given details." }, { status: 404 });
    }

    return NextResponse.json({ rates: combinedRates });

  } catch (error: any) {
    console.error("Admin Rate Calculator Main Error:", error);
    return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
  }
}