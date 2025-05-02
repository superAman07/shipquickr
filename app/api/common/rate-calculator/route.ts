import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";

interface RateResult {
  courierName: string;
  serviceType?: string; 
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
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
 
    const commonShipmentData = {
      orginPincode: parseInt(body.pickupPincode), 
      originPincode: parseInt(body.pickupPincode), 
      destinationPincode: parseInt(body.destinationPincode),
      productType: body.paymentMode === "COD" ? "cod" : "ppd",  
      chargeableWeight: cw,
      codAmount: body.paymentMode === "COD"
        ? parseFloat(body.collectableValue) || 0
        : 0,
      declaredValue: parseFloat(body.declaredValue) || parseFloat(body.collectableValue) || 50 // Example
    };
    console.log("Common Shipment Data:", commonShipmentData);

    const promises = [
      fetchEcomRates(commonShipmentData, cw),
    ];

    const results = await Promise.allSettled(promises);
 
    const allRates: RateResult[] = [];
    results.forEach((result, index) => {
      const courierName = index === 0 ? "Ecom Express" : "Another Courier"; 
      if (result.status === 'fulfilled' && result.value) {
         if (Array.isArray(result.value)) {
          allRates.push(...result.value);
        } else {
          allRates.push(result.value);
        }
        console.log(`${courierName} rates fetched successfully.`);
      } else if (result.status === 'rejected') {
        console.error(`${courierName} API call failed:`, result.reason);
      } else {
        console.error(`${courierName} returned no rates or failed silently.`);
      }
    });

    if (allRates.length === 0) {
      return NextResponse.json({ error: "No shipping rates found for the given details." }, { status: 404 });
    }
    return NextResponse.json({ rates: allRates });

  } catch (error: any) { 
    console.error("Rate Calculator Main Error:", error);
    if (error instanceof SyntaxError) {  
        return NextResponse.json({ error: "Invalid request format. Please send valid JSON." }, { status: 400 });
    } 
    return NextResponse.json({ error: "Failed to fetch rates due to an internal server error." }, { status: 500 });
  }
}