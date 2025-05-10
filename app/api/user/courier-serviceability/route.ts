 import { NextRequest, NextResponse } from "next/server";
import axios from "axios"; 

interface SimpleServiceInfo {
  courierName: string;
}



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickupPincode, destinationPincode } = body;

    if (!pickupPincode || !destinationPincode) {
      return NextResponse.json(
        { error: "Missing pickupPincode or destinationPincode" },
        { status: 400 }
      );
    }
    if (
      String(pickupPincode).length !== 6 ||
      String(destinationPincode).length !== 6 ||
      !/^\d+$/.test(pickupPincode) ||
      !/^\d+$/.test(destinationPincode)
    ) {
      return NextResponse.json(
        { error: "Invalid pincode format. Pincodes must be 6 digits." },
        { status: 400 }
      );
    }

    const availableCouriers: SimpleServiceInfo[] = [];

    if (await isShadowfaxServiceable(String(pickupPincode), String(destinationPincode))) {
      availableCouriers.push({ courierName: "Shadowfax" });
    }

    const ecomServiceInfo = await getEcomExpressServiceInfo(String(pickupPincode), String(destinationPincode));
    if (ecomServiceInfo) {
      availableCouriers.push(ecomServiceInfo);
    }

    if (availableCouriers.length === 0) {
      return NextResponse.json(
        { couriers: [], message: "Shadowfax service not available for the given pincodes." },
        { status: 200 }
      );
    }

    return NextResponse.json({ couriers: availableCouriers });
  } catch (error: any) {
    console.error("Courier Serviceability API Error:", error);
     if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch courier serviceability." },
      { status: 500 }
    );
  }
}


async function isShadowfaxServiceable(
  originPincode: string,
  destinationPincode: string
): Promise<boolean> {
  const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPincode},${destinationPincode}`;
  const apiToken = process.env.SHADOWFAX_API_TOKEN;

  if (!process.env.SHADOWFAX_SERVICEABILITY_API_URL || !apiToken) {
    console.error("Shadowfax Serviceability API URL or Token is not configured for serviceability check.");
    return false;
  }

  try {
    const response = await axios.get(serviceabilityUrl, {
      headers: { Authorization: `Token ${apiToken}` },
    });
    if (response.data && Array.isArray(response.data)) {
      const destInfo = response.data.find(
        (p: any) => String(p.code) === destinationPincode
      );
      return !!(destInfo && destInfo.services && destInfo.services.length > 0);
    }
  } catch (error: any) {
    console.error(
      "Error checking Shadowfax serviceability:",
      error.response?.data || error.message
    );
  }
  return false;
}


async function getEcomExpressServiceInfo(
  originPincode: string,
  destinationPincode: string
): Promise<SimpleServiceInfo | null> {  
  const apiUrl = process.env.ECOM_EXPRESS_RATE_API_URL; 
  const username = process.env.ECOM_EXPRESS_USERNAME;
  const password = process.env.ECOM_EXPRESS_PASSWORD;

  if (!apiUrl || !username || !password) {
    console.error("Ecom Express Rate API URL or credentials are not configured.");
    return null;
  }

  const ecomShipmentPayload = {
    orginPincode: parseInt(originPincode),
    destinationPincode: parseInt(destinationPincode),
    productType: "ppd",  
    chargeableWeight: 0.5,  
    codAmount: 0,
    declaredValue: 50,
    length: 10,
    breadth: 10,
    height: 10,
    actual_weight: 0.5,
    volumetric_weight: 0.1,  
    collectable_value: 0,
    invoice_value: 50,
    pickup_pincode: originPincode, 
    delivery_pincode: destinationPincode,
  };

  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("json_input", JSON.stringify([ecomShipmentPayload]));

  try {
    const { data } = await axios.post(apiUrl, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (Array.isArray(data) && data.length > 0 && data[0].success) {
      return { courierName: "Ecom Express" };  
    } else {
      console.warn("Ecom Express Rate API - Service not available or error:", data[0]?.errors?.reason || data);
    }
  } catch (error: any) {
    console.error(
      "Error checking Ecom Express serviceability via Rate API:",
      error.response?.data || error.message
    );
  }
  return null;
}