import { NextRequest, NextResponse } from "next/server";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { delhiveryClient } from "@/lib/services/delhivery";

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
    // Call both Aggregator and Delhivery
    const [aggregatorRates, delhiverySurface, delhiveryExpress] = await Promise.all([
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
      )
    ]);

    const rates = aggregatorRates || [];
    if (delhiverySurface) rates.push(delhiverySurface);
    if (delhiveryExpress) rates.push(delhiveryExpress);

    if (rates.length === 0) {
      return NextResponse.json({ error: "No shipping rates found for the given details." }, { status: 404 });
    }

    return NextResponse.json({ rates });

  } catch (error: any) {
    console.error("Admin Rate Calculator Main Error:", error);
    return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
  }
}