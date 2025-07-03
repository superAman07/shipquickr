import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";
import { prisma } from "@/lib/prisma";
import shadowfaxManualRatesFromFile from "@/lib/data/shadowfax-rates.json";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";

interface RateResult {
  courierName: string;
  serviceType?: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
}

interface CommonShipmentDataType {
  orginPincode: number;
  originPincode: number;
  destinationPincode: number;
  productType: "cod" | "ppd";
  chargeableWeight: number;
  codAmount: number;
  declaredValue: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requiredFields = [
      "pickupPincode",
      "destinationPincode",
      "weight",
      "length",
      "width",
      "height",
      "paymentMode",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in body) || !body[field]
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }
    if (
      body.paymentMode === "COD" &&
      (!("collectableValue" in body) || !body.collectableValue)
    ) {
      return NextResponse.json(
        { error: "Missing required field: collectableValue for COD" },
        { status: 400 }
      );
    }

    const l = parseFloat(body.length) || 1;
    const w = parseFloat(body.width) || 1;
    const h = parseFloat(body.height) || 1;
    const actual = parseFloat(body.weight) || 0.01;
    const volumetric = (l * w * h) / 5000;
    const cw = Math.max(actual, volumetric, 0.5);

    const dimensions = { l, w, h };

    const commonShipmentData: CommonShipmentDataType = {
      orginPincode: parseInt(body.pickupPincode),
      originPincode: parseInt(body.pickupPincode),
      destinationPincode: parseInt(body.destinationPincode),
      productType: body.paymentMode === "COD" ? "cod" : "ppd",
      chargeableWeight: cw,
      codAmount:
        body.paymentMode === "COD" ? parseFloat(body.collectableValue) || 0 : 0,
      declaredValue: Math.max(
        parseFloat(body.declaredValue) || 0,
        body.paymentMode === "COD" ? parseFloat(body.collectableValue) || 0 : 0,
        50
      ),
    };
    console.log("Common Shipment Data:", commonShipmentData);
    console.log("Dimensions:", dimensions);

    const adminRates = await prisma.shippingRates.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!adminRates) {
      console.error(
        "Admin shipping rates not found in database. Using defaults."
      );
    }
    const adminBaseRatePerKg = adminRates?.courierChargesAmount ?? 0;
    const adminChargeType = adminRates?.courierChargesType ?? "fixed";
    const adminCodRate = adminRates?.codChargesAmount ?? 0;
    const adminCodType = adminRates?.codChargesType ?? "fixed";

    const promises = [
      ecomExpressClient.getEcomExpressOptions(commonShipmentData, cw),
      xpressbeesClient.getXpressbeesOptions(commonShipmentData, cw, dimensions), // Call the method on the imported instance
      // fetchShadowfaxRates(commonShipmentData, cw, dimensions),
    ];

    const results = await Promise.allSettled(promises);

    const allRates: RateResult[] = [];
    results.forEach((result, index) => {
      const courierIdentifier =
        index === 0 ? "Ecom Express" : index === 1 ? "Xpressbees" : "Shadowfax";
      if (result.status === "fulfilled" && result.value) {
        if (Array.isArray(result.value)) {
          allRates.push(...result.value.filter((r) => r !== null));
        } else if (result.value !== null) {
          allRates.push(result.value);
        }
        const fetchedCourierName = Array.isArray(result.value)
          ? result.value[0]?.courierName
          : result.value?.courierName;
        console.log(
          `${fetchedCourierName || courierIdentifier} rates fetched successfully.`
        );
      } else if (result.status === "rejected") {
        console.error(`${courierIdentifier} API call failed:`, result.reason);
      } else {
        console.error(
          `${courierIdentifier} returned no rates or failed silently.`
        );
      }
    });

    if (allRates.length === 0) {
      return NextResponse.json(
        { error: "No shipping rates found for the given details." },
        { status: 404 }
      );
    }
    const finalRates = allRates.map((rate) => {
      let finalCourierCharge = rate.courierCharges;
      let finalCodCharge = 0;
      let courierMarkup = 0;
      if (adminChargeType === "fixed") {
        courierMarkup = adminBaseRatePerKg;
      } else if (adminChargeType === "percentage") {
        courierMarkup = rate.courierCharges * (adminBaseRatePerKg / 100);
      }
      finalCourierCharge += courierMarkup;

      if (body.paymentMode === "COD") {
        if (adminCodType === "fixed") {
          finalCodCharge = adminCodRate + rate.codCharges;
        } else if (adminCodType === "percentage" && rate.codCharges > 0) {
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
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format. Please send valid JSON." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch rates due to an internal server error." },
      { status: 500 }
    );
  }
}

// shadowfax still not working correctly <--- ignore for now
interface ShadowfaxApiPincodeInfo {
  code: number;  
  services: string[];  
}

type ShadowfaxServiceabilityApiResponse = ShadowfaxApiPincodeInfo[];

interface ShadowfaxManualRateEntry {
  serviceName: string;
  serviceTypeKey: string;
  minWeight: number;
  baseRate: number;
  ratePerKgAboveMin: number;
  codFixedCharge: number;
  codPercentage?: number;
}
const shadowfaxManualRates: ShadowfaxManualRateEntry[] =
  shadowfaxManualRatesFromFile;
async function fetchShadowfaxRates(
  commonShipmentData: CommonShipmentDataType,
  cw: number,
  dimensions: { l: number; w: number; h: number }
): Promise<RateResult[] | null> {
  const {
    originPincode,
    destinationPincode,
    productType,
    codAmount,
    declaredValue,
  } = commonShipmentData;
  const paymentMode = productType === "cod" ? "COD" : "Prepaid";
  
  const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPincode},${destinationPincode}`;
  const apiToken = process.env.SHADOWFAX_API_TOKEN;

  if (!process.env.SHADOWFAX_SERVICEABILITY_API_URL) {
    console.error("Shadowfax Serviceability API URL is not configured.");
    return null;
  }
  if (!apiToken) {
    console.error("Shadowfax API Token is not configured.");
    return null;
  }

  const headers: Record<string, string> = {
    Authorization: `Token ${apiToken}`,
  };
  try {
    const serviceabilityResponse =
      await axios.get<ShadowfaxServiceabilityApiResponse>(serviceabilityUrl, {
        headers,
      });
    const responseData = serviceabilityResponse.data;
    console.log("Shadowfax Serviceability Response:", responseData);

    if (!Array.isArray(responseData) || responseData.length === 0) {
      console.log(
        "Shadowfax not serviceable or API error: No data or unexpected format returned."
      );
      return null;
    }
    const destinationServiceInfo = responseData.find(
      (p) => p.code === destinationPincode
    );
    console.log("Destination Service Info:", destinationServiceInfo);
    if (
      !destinationServiceInfo ||
      !destinationServiceInfo.services ||
      destinationServiceInfo.services.length === 0
    ) {
      console.log(
        `Shadowfax customer_delivery not available or no services listed for pincode: ${destinationPincode}`
      );
      return null;
    }

    const availableRates: RateResult[] = [];
    const apiServiceTypes = destinationServiceInfo.services;
    console.log("Available Service Types:", apiServiceTypes);

    if (apiServiceTypes && apiServiceTypes.length > 0) {
      for (const serviceNameFromApi of apiServiceTypes) {
        let serviceTypeKey = "";
        if (serviceNameFromApi.toLowerCase().includes("regular"))
          serviceTypeKey = "standard";  
        else if (serviceNameFromApi.toLowerCase().includes("surface"))
          serviceTypeKey = "surface";  
        else if (serviceNameFromApi.toLowerCase().includes("express"))
          serviceTypeKey = "express";

        if (serviceTypeKey) {
          const rateRule = shadowfaxManualRates.find(
            (r) =>
              r.serviceTypeKey.toLowerCase() === serviceTypeKey.toLowerCase()
          );
          if (rateRule) {
            let rawFreight = rateRule.baseRate;
            if (cw > rateRule.minWeight) {
              rawFreight +=
                Math.ceil(cw - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
            }

            let rawCodApiCharge = 0;
            if (paymentMode === "COD") {
              rawCodApiCharge = rateRule.codFixedCharge;
              if (rateRule.codPercentage && rateRule.codPercentage > 0) {
                rawCodApiCharge += (codAmount * rateRule.codPercentage) / 100;
              }
            }

            availableRates.push({
              courierName: "Shadowfax",
              serviceType: rateRule.serviceName,
              weight: cw,
              courierCharges: parseFloat(rawFreight.toFixed(2)),
              codCharges: parseFloat(rawCodApiCharge.toFixed(2)),
              totalPrice: parseFloat((rawFreight + rawCodApiCharge).toFixed(2)),
            });
          }
        }
      }
    }
    if (availableRates.length === 0) {
      console.warn(
        `No specific service types mapped or available from Shadowfax API for pincode ${destinationPincode}. Checking all manual rates as fallback.`
      );
      for (const rateRule of shadowfaxManualRates) {
        const originServiceInfo = responseData.find(
          (p) => p.code === originPincode
        );
        if (
          originServiceInfo &&
          originServiceInfo.services &&
          originServiceInfo.services.some((s) =>
            s.toLowerCase().includes(rateRule.serviceTypeKey.toLowerCase())
          )
        ) {
          let rawFreight = rateRule.baseRate;
          if (cw > rateRule.minWeight) {
            rawFreight +=
              Math.ceil(cw - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
          }
          let rawCodApiCharge = 0;
          if (paymentMode === "COD") {
            rawCodApiCharge = rateRule.codFixedCharge;
            if (rateRule.codPercentage && rateRule.codPercentage > 0) {
              rawCodApiCharge += (codAmount * rateRule.codPercentage) / 100;
            }
          }
          availableRates.push({
            courierName: "Shadowfax",
            serviceType: rateRule.serviceName,
            weight: cw,
            courierCharges: parseFloat(rawFreight.toFixed(2)),
            codCharges: parseFloat(rawCodApiCharge.toFixed(2)),
            totalPrice: parseFloat((rawFreight + rawCodApiCharge).toFixed(2)),
          });
        }
      }
    }

    return availableRates.length > 0 ? availableRates : null;
  } catch (error: any) {
    console.error(
      "Error fetching Shadowfax options:",
      error.response?.data || error.message
    );
    return null;
  }
}
