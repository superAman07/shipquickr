import { NextRequest, NextResponse } from "next/server";
import axios from "axios"; 
import shadowfaxManualRatesFromFile from "@/lib/data/shadowfax-rates.json";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { xpressbeesClient } from "@/lib/services/xpressbees";
import { cookies } from "next/headers";  
import { jwtDecode } from "jwt-decode";    

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

interface AdminTokenDetailsType {  
    userId: number;  
    role: string;
    exp: number;
}

export async function POST(req: NextRequest) {
  try { 
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Admin token missing" }, { status: 401 });
    }
    let decodedAdmin: AdminTokenDetailsType;
    try {
        decodedAdmin = jwtDecode<AdminTokenDetailsType>(token);
    } catch (error) {
        return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }
    if (decodedAdmin.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Admin token expired" }, { status: 401 });
    }
    if (decodedAdmin.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

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
      (!("collectableValue" in body) || body.collectableValue === undefined || body.collectableValue === null) // Check for presence and non-null/undefined
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
    console.log("ADMIN: Common Shipment Data:", commonShipmentData);
    console.log("ADMIN: Dimensions:", dimensions);

    const promises = [
      ecomExpressClient.getEcomExpressOptions(commonShipmentData, cw),
      xpressbeesClient.getXpressbeesOptions(commonShipmentData, cw, dimensions),
      fetchShadowfaxRates(commonShipmentData, cw, dimensions),  
    ];

    const results = await Promise.allSettled(promises);

    const allBaseRates: RateResult[] = [];  
    results.forEach((result, index) => {
      const courierIdentifier =
        index === 0 ? "Ecom Express" : index === 1 ? "Xpressbees" : "Shadowfax";
      if (result.status === "fulfilled" && result.value) {
        if (Array.isArray(result.value)) {
          allBaseRates.push(...result.value.filter((r) => r !== null));
        } else if (result.value !== null) {
          allBaseRates.push(result.value);
        }
        const fetchedCourierName = Array.isArray(result.value)
          ? result.value[0]?.courierName
          : result.value?.courierName;
        console.log(
          `ADMIN: ${fetchedCourierName || courierIdentifier} base rates fetched successfully.`
        );
      } else if (result.status === "rejected") {
        console.error(`ADMIN: ${courierIdentifier} API call failed:`, result.reason);
      } else {
        console.error(
          `ADMIN: ${courierIdentifier} returned no base rates or failed silently.`
        );
      }
    });

    if (allBaseRates.length === 0) {
      return NextResponse.json(
        { error: "No shipping rates found from couriers for the given details." },
        { status: 404 }
      );
    }

    const finalRates = allBaseRates.map(rate => ({
        ...rate, 
        totalPrice: Math.round((rate.courierCharges + rate.codCharges) * 100) / 100
    }));

    return NextResponse.json({ rates: finalRates });

  } catch (error: any) {
    console.error("ADMIN Rate Calculator Main Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format. Please send valid JSON." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch admin rates due to an internal server error." },
      { status: 500 }
    );
  }
}

// --- Shadowfax specific logic (copied from user route, should return base rates) ---
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
    // declaredValue, // Not directly used in Shadowfax manual rate calculation logic here
  } = commonShipmentData;
  const paymentMode = productType === "cod" ? "COD" : "Prepaid";

  const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPincode},${destinationPincode}`;
  const apiToken = process.env.SHADOWFAX_API_TOKEN;

  if (!process.env.SHADOWFAX_SERVICEABILITY_API_URL) {
    console.error("ADMIN: Shadowfax Serviceability API URL is not configured.");
    return null;
  }
  if (!apiToken) {
    console.error("ADMIN: Shadowfax API Token is not configured.");
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
    console.log("ADMIN: Shadowfax Serviceability Response:", responseData);

    if (!Array.isArray(responseData) || responseData.length === 0) {
      console.log(
        "ADMIN: Shadowfax not serviceable or API error: No data or unexpected format returned."
      );
      return null;
    }
    const destinationServiceInfo = responseData.find(
      (p) => p.code === destinationPincode
    );
    console.log("ADMIN: Destination Service Info:", destinationServiceInfo);
    if (
      !destinationServiceInfo ||
      !destinationServiceInfo.services ||
      destinationServiceInfo.services.length === 0
    ) {
      console.log(
        `ADMIN: Shadowfax customer_delivery not available or no services listed for pincode: ${destinationPincode}`
      );
      return null;
    }

    const availableRates: RateResult[] = [];
    const apiServiceTypes = destinationServiceInfo.services;
    console.log("ADMIN: Available Shadowfax Service Types from API:", apiServiceTypes);

    if (apiServiceTypes && apiServiceTypes.length > 0) {
      for (const serviceNameFromApi of apiServiceTypes) {
        let serviceTypeKey = "";
        // Mapping from API service names to your internal keys
        if (serviceNameFromApi.toLowerCase().includes("regular")) serviceTypeKey = "standard";
        else if (serviceNameFromApi.toLowerCase().includes("surface")) serviceTypeKey = "surface";
        else if (serviceNameFromApi.toLowerCase().includes("express")) serviceTypeKey = "express";
        // Add more mappings if needed

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
        `ADMIN: No specific service types mapped or available from Shadowfax API for pincode ${destinationPincode}. Checking all manual rates as fallback for origin serviceability.`
      );
      for (const rateRule of shadowfaxManualRates) {
        const originServiceInfo = responseData.find( // Check if origin supports the general service type
          (p) => p.code === originPincode
        );
        if (
          originServiceInfo &&
          originServiceInfo.services &&
          originServiceInfo.services.some((s) => // Check if any of origin's services match the rateRule's key
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
      "ADMIN: Error fetching Shadowfax options:",
      error.response?.data || error.message
    );
    return null;
  }
}