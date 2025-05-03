import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";
import { prisma } from "@/lib/prisma";

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
      declaredValue: parseFloat(body.declaredValue) || parseFloat(body.collectableValue) || 50  
    };
    console.log("Common Shipment Data:", commonShipmentData);
    console.log("Dimensions:", dimensions);

    const adminRates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
    if (!adminRates) {
      console.error("Admin shipping rates not found in database. Using defaults.");
    }
    const adminBaseRatePerKg = adminRates?.courierChargesAmount ?? 0; 
    const adminChargeType = adminRates?.courierChargesType ?? "fixed";
    const adminCodRate = adminRates?.codChargesAmount ?? 30; 
    const adminCodType = adminRates?.codChargesType ?? "fixed";
    // const minCodCharge = 30; 

    const promises = [
      fetchEcomRates(commonShipmentData, cw),
      fetchXpressbeesRates(commonShipmentData, cw, dimensions),
    ];

    const results = await Promise.allSettled(promises);
 
    const allRates: RateResult[] = [];
    results.forEach((result, index) => { 
      const courierIdentifier = index === 0 ? "Ecom Express" : "Xpressbees";   
      if (result.status === 'fulfilled' && result.value) {
         if (Array.isArray(result.value)) {
          allRates.push(...result.value);
        } else {
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
          // const collectableValue = parseFloat(body.collectableValue) || 0;
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
      return {
        courierName: "Ecom Express",
        serviceType: "Standard", 
        weight: cw,
        courierCharges: parseFloat(breakup.FRT) || 0, 
        codCharges: parseFloat(breakup.COD) || 0,  
        totalPrice: parseFloat(breakup.total_charge) || 0,  
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


async function fetchXpressbeesRates(shipmentData: any, cw: number, dimensions: { l: number, w: number, h: number }): Promise<RateResult[] | null> {
  const apiUrl = process.env.XPRESSBEES_RATE_API_URL;
  const bearerToken = process.env.XPRESSBEES_BEARER_TOKEN;

  if (!apiUrl || !bearerToken) {
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
      cod_amount: String(shipmentData.codAmount), 
      cod: shipmentData.productType === "cod" ? "yes" : "no",
  };

  try {
      console.log("Xpressbees Request Payload:", xpressbeesPayload);
      const { data } = await axios.post(apiUrl, xpressbeesPayload, {
          headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json'
          }
      });
      console.log("Xpressbees API Response:", data);
 
      if (data && data.status === true && Array.isArray(data.message)) {
        return data.message.map((rate: any) => ({
            courierName: "Xpressbees",
            serviceType: rate.name || "Standard",
            weight: cw, 
            courierCharges: parseFloat(rate.courier_charges) || 0,
            codCharges: parseFloat(rate.cod_charges) || 0,
            totalPrice: parseFloat(rate.total_price) || 0,
        }));
    } else { 
        console.error("Xpressbees API returned unexpected format or status false:", data);
        return null;
    }
  } catch (error: any) {
      console.error("Xpressbees API Call Error:", error.response?.data || error.message);
      if (error.response?.status) {
          console.error("Xpressbees API Error Status:", error.response.status);
      }
      return null;
  }
}