import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        if (body.paymentMode === 'COD' && (!('collectableValue' in body) || !body.collectableValue)) {
            return NextResponse.json({ error: "Missing required field: collectableValue for COD" }, { status: 400 });
        }

        const l = parseFloat(body.length) || 1;
        const w = parseFloat(body.width) || 1;
        const h = parseFloat(body.height) || 1;
        const actual = parseFloat(body.weight) || 0.01;
        const volumetric = (l * w * h) / 5000;
        const cw = Math.max(actual, volumetric, 0.5);

        const dimensions = { length: l, width: w, height: h };
        const declaredValue = Math.max(parseFloat(body.declaredValue) || 0, body.paymentMode === "COD" ? (parseFloat(body.collectableValue) || 0) : 0, 50);
        const codAmount = body.paymentMode === "COD" ? parseFloat(body.collectableValue) || 0 : 0;

        // 1. Fetch Admin Markup Settings
        const adminRates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
        const adminBaseRatePerKg = adminRates?.courierChargesAmount ?? 0;
        const adminChargeType = adminRates?.courierChargesType ?? "fixed";
        const adminCodRate = adminRates?.codChargesAmount ?? 0;
        const adminCodType = adminRates?.codChargesType ?? "fixed";

        // 2. Fetch Raw Rates from Aggregator
        // 2. Fetch Rates from Aggregator AND Delhivery
        const [rawRates, delhiveryRate] = await Promise.all([
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
                "Surface", // defaulting to Surface for now, can be dynamic based on user pref
                body.paymentMode,
                declaredValue
            )
        ]);

        let combinedRates = rawRates || [];
        if (delhiveryRate) {
            combinedRates.push(delhiveryRate);
        }

        if (combinedRates.length === 0) {
            return NextResponse.json({ error: "No shipping rates found for the given details." }, { status: 404 });
        }

        // 3. Apply Admin Markup (Logic preserved...)
        const finalRates = combinedRates.map(rate => {
            let finalCourierCharge = rate.courierCharges;
            let finalCodCharge = 0;
            let courierMarkup = 0;

            // Apply Courier Charge Markup
            if (adminChargeType === 'fixed') {
                courierMarkup = adminBaseRatePerKg;
            } else if (adminChargeType === 'percentage') {
                courierMarkup = rate.courierCharges * (adminBaseRatePerKg / 100);
            }
            finalCourierCharge += courierMarkup;

            // Apply COD Markup
            if (body.paymentMode === "COD") {
                if (adminCodType === 'fixed') {
                    finalCodCharge = adminCodRate + rate.codCharges;
                } else if (adminCodType === 'percentage' && rate.codCharges > 0) {
                    const codMarkup = rate.codCharges * (adminCodRate / 100);
                    finalCodCharge = rate.codCharges + codMarkup;
                } else {
                    finalCodCharge = rate.codCharges;
                }
            }

            const finalTotalPrice = finalCourierCharge + finalCodCharge;

            return {
                ...rate,
                courierCharges: Math.round(finalCourierCharge * 100) / 100,
                codCharges: Math.round(finalCodCharge * 100) / 100,
                totalPrice: Math.round(finalTotalPrice * 100) / 100,
            };
        });

        return NextResponse.json({ rates: finalRates });

    } catch (error: any) {
        console.error("Rate Calculator Main Error:", error);
        return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
    }
}