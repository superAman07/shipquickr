import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";
import { prisma } from "@/lib/prisma";
import shadowfaxManualRatesFromFile from '@/lib/data/shadowfax-rates.json';  

interface RateResult {
  courierName: string;
  serviceType?: string; 
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
}

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
    const w = parseFloat(body.width)  || 1;
    const h = parseFloat(body.height) || 1;
    const actual = parseFloat(body.weight) || 0.01; 
    const volumetric = (l * w * h) / 5000; 
    const cw = Math.max(actual, volumetric, 0.5);

    const dimensions = { l, w, h };
 
    const commonShipmentData = {
      orginPincode: parseInt(body.pickupPincode), 
      originPincode: parseInt(body.pickupPincode), 
      destinationPincode: parseInt(body.destinationPincode),
      productType: body.paymentMode === "COD" ? "cod" : "ppd",  
      chargeableWeight: cw,
      codAmount: body.paymentMode === "COD"
        ? parseFloat(body.collectableValue) || 0
        : 0,
        declaredValue: Math.max(parseFloat(body.declaredValue) || 0, body.paymentMode === "COD" ? (parseFloat(body.collectableValue) || 0) : 0, 50)
    };
    console.log("Common Shipment Data:", commonShipmentData);
    console.log("Dimensions:", dimensions);

    const adminRates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
    if (!adminRates) {
      console.error("Admin shipping rates not found in database. Using defaults.");
    }
    const adminBaseRatePerKg = adminRates?.courierChargesAmount ?? 0; 
    const adminChargeType = adminRates?.courierChargesType ?? "fixed";
    const adminCodRate = adminRates?.codChargesAmount ?? 0; 
    const adminCodType = adminRates?.codChargesType ?? "fixed"; 

    const promises = [
      fetchEcomRates(commonShipmentData, cw),
      fetchXpressbeesRates(commonShipmentData, cw, dimensions),
      fetchShadowfaxRates(commonShipmentData, cw, dimensions),
    ];

    const results = await Promise.allSettled(promises);
 
    const allRates: RateResult[] = [];
    results.forEach((result, index) => { 
      const courierIdentifier = index === 0 ? "Ecom Express" : index === 1 ? "Xpressbees" : "Shadowfax";   
      if (result.status === 'fulfilled' && result.value) {
         if (Array.isArray(result.value)) {
          allRates.push(...result.value.filter(r => r !== null));
        } else if (result.value !== null){
          allRates.push(result.value);
        } 
        const fetchedCourierName = Array.isArray(result.value) ? result.value[0]?.courierName : result.value?.courierName;
        console.log(`${fetchedCourierName || courierIdentifier} rates fetched successfully.`);
      } else if (result.status === 'rejected') {
        console.error(`${courierIdentifier} API call failed:`, result.reason);
      } else {
        console.error(`${courierIdentifier} returned no rates or failed silently.`);
      }
    });

    if (allRates.length === 0) {
      return NextResponse.json({ error: "No shipping rates found for the given details." }, { status: 404 });
    }
    const finalRates = allRates.map(rate => {
      let finalCourierCharge = rate.courierCharges;
      let finalCodCharge = 0; 
      let courierMarkup = 0;
      if (adminChargeType === 'fixed') {
          courierMarkup = adminBaseRatePerKg;
      } else if (adminChargeType === 'percentage') {
          courierMarkup = rate.courierCharges * (adminBaseRatePerKg / 100);
      }
      finalCourierCharge += courierMarkup;

      if (body.paymentMode === "COD") { 
          if (adminCodType === 'fixed') {
            finalCodCharge = adminCodRate + rate.codCharges;
          }else if (adminCodType === 'percentage' && rate.codCharges > 0) {
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
        return NextResponse.json({ error: "Invalid request format. Please send valid JSON." }, { status: 400 });
    } 
    return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
  }
}

// shadowfax

interface ShadowfaxServiceabilityPincodeInfo {
    pincode: string;
    services: {
        customer_delivery?: {
            available: boolean;
            service_types?: Array<{ name: string; available: boolean }>;
        };
    };
}
interface ShadowfaxServiceabilityResponse {
    success: boolean;
    message?: string;
    data?: ShadowfaxServiceabilityPincodeInfo[];
}
interface ShadowfaxManualRateEntry {
    serviceName: string;
    serviceTypeKey: string;
    minWeight: number;
    baseRate: number;
    ratePerKgAboveMin: number;
    codFixedCharge: number;
    codPercentage?: number;
}
const shadowfaxManualRates: ShadowfaxManualRateEntry[] = shadowfaxManualRatesFromFile;
async function fetchShadowfaxRates(
    commonShipmentData: any, // Use a more specific type if possible
    cw: number,
    dimensions: { l: number; w: number; h: number }
): Promise<RateResult[] | null> {
    const { originPincode, destinationPincode, productType, codAmount, declaredValue } = commonShipmentData;
    const paymentMode = productType === "cod" ? "COD" : "Prepaid"; // Convert back for consistency

    const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPincode},${destinationPincode}`;
    
    const headers: Record<string, string> = {};
    if (process.env.SHADOWFAX_API_TOKEN) headers['Authorization'] = `Bearer ${process.env.SHADOWFAX_API_TOKEN}`;
    if (process.env.SHADOWFAX_CLIENT_CODE) headers['client-code'] = process.env.SHADOWFAX_CLIENT_CODE;

    try {
        const serviceabilityResponse = await axios.get<ShadowfaxServiceabilityResponse>(serviceabilityUrl, { headers });
        const responseData = serviceabilityResponse.data;

        if (!responseData.success || !responseData.data || responseData.data.length === 0) {
            console.log("Shadowfax not serviceable or API error:", responseData.message);
            return null;
        }

        const destinationServiceInfo = responseData.data.find(p => p.pincode === String(destinationPincode));
        if (!destinationServiceInfo?.services?.customer_delivery?.available) {
            console.log(`Shadowfax customer_delivery not available for pincode: ${destinationPincode}`);
            return null;
        }
        
        const availableRates: RateResult[] = [];
        const apiServiceTypes = destinationServiceInfo.services.customer_delivery.service_types;

        if (apiServiceTypes && apiServiceTypes.length > 0) {
            for (const st of apiServiceTypes) {
                if (st.available) {
                    let serviceTypeKey = "";
                    if (st.name.toLowerCase().includes("standard")) serviceTypeKey = "standard";
                    else if (st.name.toLowerCase().includes("express")) serviceTypeKey = "express";
                    // Add more mappings if Shadowfax has other service names

                    if (serviceTypeKey) {
                        const rateRule = shadowfaxManualRates.find(r => r.serviceTypeKey.toLowerCase() === serviceTypeKey.toLowerCase());
                        if (rateRule) {
                            let rawFreight = rateRule.baseRate;
                            if (cw > rateRule.minWeight) {
                                rawFreight += Math.ceil(cw - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
                            }

                            let rawCodApiCharge = 0;
                            if (paymentMode === 'COD') {
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
        } else {
            // Fallback if API doesn't specify service types (less ideal)
            for (const rateRule of shadowfaxManualRates) {
                 let rawFreight = rateRule.baseRate;
                 if (cw > rateRule.minWeight) {
                     rawFreight += Math.ceil(cw - rateRule.minWeight) * rateRule.ratePerKgAboveMin;
                 }
                 let rawCodApiCharge = 0;
                 if (paymentMode === 'COD') {
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
        
        return availableRates.length > 0 ? availableRates : null;

    } catch (error: any) {
        console.error("Error fetching Shadowfax options:", error.response?.data || error.message);
        return null;
    }
}



// ecom express
async function fetchEcomRates(shipmentData: any, cw: number): Promise<RateResult | null> {
  const ecomShipmentPayload = {
    ...shipmentData,
    orginPincode: shipmentData.orginPincode,  
  };

  const formData = new URLSearchParams();
  formData.append("username", process.env.ECOM_EXPRESS_USERNAME || "");
  formData.append("password", process.env.ECOM_EXPRESS_PASSWORD || "");
  formData.append("json_input", JSON.stringify([ecomShipmentPayload]));

  const apiUrl = process.env.ECOM_EXPRESS_RATE_API_URL;
  if (!apiUrl) {
    console.error("Ecom Express Rate API URL is not configured.");
    return null;
  }

  try {
    const { data } = await axios.post(apiUrl, formData);
    console.log("Ecom API Response:", JSON.stringify(data, null, 2)); 

    if (Array.isArray(data) && data.length > 0 && data[0].success) {
      const breakup = data[0].chargesBreakup || {};
      const rawCourierCharge = (parseFloat(breakup.FRT) || 0) + (parseFloat(breakup.FUEL) || 0);  
      const rawCodCharge = parseFloat(breakup.COD) || 0;
      return {
        courierName: "Ecom Express",
        serviceType: "Standard", 
        weight: cw, 
        courierCharges: rawCourierCharge, 
        codCharges: rawCodCharge,     
        totalPrice: rawCourierCharge + rawCodCharge,  
      };
    } else { 
      console.error("Ecom API returned error or unexpected format:", data[0]?.errors?.reason || data);
      return null;  
    }
  } catch (error: any) { 
    console.error("Ecom API Call Error:", error.response?.data || error.message);
    return null; 
  }
}

// yaha se expressbees ka code shuru hota hai

let currentXpressbeesToken: string | null = null;

let tokenExpiryTime: number | null = null;
const TOKEN_BUFFER_SECONDS = 300;  

async function getValidXpressbeesToken(): Promise<string | null> {
  const now = Date.now();
  if (currentXpressbeesToken && tokenExpiryTime && (tokenExpiryTime - TOKEN_BUFFER_SECONDS * 1000) > now) {
      console.log("Using existing valid Xpressbees token.");
      return currentXpressbeesToken;
  }
  console.log("Xpressbees token is invalid or expired, fetching new one...");
  currentXpressbeesToken = await getNewXpressbeesToken();  
  return currentXpressbeesToken;
}

async function getNewXpressbeesToken(): Promise<string | null> {
  const loginUrl = process.env.XPRESSBEES_LOGIN_API_URL;
  const email = process.env.XPRESSBEES_EMAIL;
  const password = process.env.XPRESSBEES_PASSWORD;

  if (!loginUrl || !email || !password) {
      console.error("Xpressbees login credentials or URL are not configured in environment variables.");
      return null;
  }
  try {
      console.log("Attempting to fetch new Xpressbees token...");
      const response = await axios.post(loginUrl, { email, password });
      if (response.data && response.data.status === true && response.data.data) {
          console.log("Successfully fetched new Xpressbees token.");
          tokenExpiryTime = Date.now() + (60 * 60 * 1000);
          return response.data.data;  
      } else {
          console.error("Failed to fetch new Xpressbees token. Response:", response.data);
          tokenExpiryTime = null;
          return null;
      }
  } catch (error: any) {
    console.error("Error fetching new Xpressbees token:", error.response?.data || error.message);
    tokenExpiryTime = null;
    return null;
  }
}

async function fetchXpressbeesRates(shipmentData: any, cw: number, dimensions: { l: number, w: number, h: number }): Promise<RateResult[] | null> {
  const apiUrl = process.env.XPRESSBEES_RATE_API_URL; 
  const token = await getValidXpressbeesToken();

  if (!apiUrl) {
      console.error("Xpressbees API URL or Bearer Token is not configured.");
      return null;
  }
  const xpressbeesPayload = {
      order_type_user: "ecom",
      origin: String(shipmentData.originPincode), 
      destination: String(shipmentData.destinationPincode), 
      weight: String(cw), 
      length: String(dimensions.l),
      height: String(dimensions.h),
      breadth: String(dimensions.w), 
      cod_amount: String(Math.max(shipmentData.declaredValue, 1)), 
      cod: shipmentData.productType === "cod" ? "yes" : "no",
      product_value: String(shipmentData.declaredValue)
  };

  try {
      console.log("Xpressbees Request Payload:", xpressbeesPayload);
      const { data } = await axios.post(apiUrl, xpressbeesPayload, {
          headers: {
              'Authorization': `Bearer ${currentXpressbeesToken}`,
              'Content-Type': 'application/json'
          }
      });
      console.log("Xpressbees API Response:", data);
 
      if (data && data.status === true && Array.isArray(data.message)) {
        const validRates = data.message
            .map((rate: any) => {
                const courierCharges = parseFloat(rate.courier_charges);
                const codCharges = parseFloat(rate.cod_charges); 
                const calculatedTotal = (isNaN(courierCharges) ? 0 : courierCharges) + (isNaN(codCharges) ? 0 : codCharges);
 
                if (!isNaN(courierCharges)) {
                    return {
                        courierName: "Xpressbees",
                        serviceType: rate.name || "Standard",  
                        weight: cw,
                        courierCharges: courierCharges,  
                        codCharges: isNaN(codCharges) ? 0 : codCharges,  
                        totalPrice: calculatedTotal  
                    };
                }
                return null;  
            })
            .filter((rate: RateResult | null): rate is RateResult => rate !== null);  

        return validRates.length > 0 ? validRates : null;
    } else { 
        console.error("Xpressbees API returned unexpected format or status false:", data);
        return null;
    }
  } catch (error: any) {
    console.error("Xpressbees API Call Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {  
        console.log("Xpressbees token might have expired. Invalidating.");
        currentXpressbeesToken = null;  
        tokenExpiryTime = null;
    }
    return null;
  }
}