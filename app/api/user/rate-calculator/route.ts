import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shippingAggregatorClient } from "@/lib/services/shipping-aggregator";
import { delhiveryClient } from "@/lib/services/delhivery";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { shadowfaxClient } from "@/lib/services/shadowfax";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

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
        // 2. Fetch Rates from Aggregator AND Delhivery, Xpressbees, Shadowfax
        const [rawRatesResult, delhiverySurfaceResult, delhiveryExpressResult, xpressbeesResult, shadowfaxResult] = await Promise.allSettled([
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
            shadowfaxClient.getShadowfaxOptions(
                body.pickupPincode,
                body.destinationPincode,
                cw,
                body.paymentMode,
                codAmount
            )
        ]);

        let combinedRates = rawRatesResult.status === "fulfilled" ? (rawRatesResult.value || []) : [];
        if (delhiverySurfaceResult.status === "fulfilled" && delhiverySurfaceResult.value) combinedRates.push(delhiverySurfaceResult.value);
        if (delhiveryExpressResult.status === "fulfilled" && delhiveryExpressResult.value) combinedRates.push(delhiveryExpressResult.value);
        if (xpressbeesResult.status === "fulfilled" && xpressbeesResult.value) combinedRates.push(...xpressbeesResult.value);
        if (shadowfaxResult.status === "fulfilled" && shadowfaxResult.value) combinedRates.push(...shadowfaxResult.value);

        try {
            const cookieStore = await cookies();
            const token = cookieStore.get("userToken")?.value;

            if (token) {
                const decoded: any = jwtDecode(token);
                if (decoded && decoded.userId) {
                    const assignments = await prisma.userCourierAssignment.findMany({
                        where: { userId: decoded.userId, isActive: true },
                        select: { courier: true, dashboardPriority: true }
                    });

                    if (assignments.length > 0) {
                        const assignedCourierNames = assignments.map(a => a.courier.toLowerCase());
                        combinedRates = combinedRates.filter(rate => {
                            const rateName = rate.courierName.toLowerCase();
                            // Catch misspelling permutations: Xpressbees vs Expressbees, ecom vs ecom express
                            if (rateName.includes("xpressbees") && assignedCourierNames.some(c => c.includes("xpress") || c.includes("express"))) return true;
                            if (rateName.includes("delhivery") && assignedCourierNames.some(c => c.includes("delhivery"))) return true;
                            if (rateName.includes("shadowfax") && assignedCourierNames.some(c => c.includes("shadowfax") || c.includes("shadow fax"))) return true;
                            if (rateName.includes("ecom") && assignedCourierNames.some(c => c.includes("ecom"))) return true;

                            return assignedCourierNames.includes(rateName) || assignedCourierNames.some(c => rateName.includes(c));
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error checking courier assignments:", e);
        }
        if (combinedRates.length === 0) {
            return NextResponse.json({ error: "No available shipping rates found for the given details." }, { status: 404 });
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

        // 4. Sort by User Dashboard Priority
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get("userToken")?.value;
            if (token) {
                const decoded: any = jwtDecode(token);
                const assignments = await prisma.userCourierAssignment.findMany({
                    where: { userId: decoded.userId, isActive: true },
                    select: { courier: true, dashboardPriority: true }
                });

                finalRates.sort((a, b) => {
                    const getPriority = (name: string) => {
                        const match = assignments.find(as =>
                            name.toLowerCase().includes(as.courier.toLowerCase()) ||
                            as.courier.toLowerCase().includes(name.toLowerCase())
                        );
                        return match?.dashboardPriority ?? 99; // Default low priority
                    };
                    const pA = getPriority(a.courierName);
                    const pB = getPriority(b.courierName);
                    if (pA !== pB) return pA - pB;
                    return a.totalPrice - b.totalPrice; // Secondary sort by price
                });
            }
        } catch (e) {
            console.error("Sorting error:", e);
        }

        return NextResponse.json({ rates: finalRates });

    } catch (error: any) {
        console.error("Rate Calculator Main Error:", error);
        return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
    }
}