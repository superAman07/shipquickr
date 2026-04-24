import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { ekartClient } from "@/lib/services/ekart";

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

    // Check all couriers in parallel for faster response
    const [shadowfaxResult, ecomResult, xpressbeesResult, delhiveryResult, ekartResult] =
      await Promise.allSettled([
        isShadowfaxServiceable(String(pickupPincode), String(destinationPincode)),
        getEcomExpressServiceInfo(String(pickupPincode), String(destinationPincode)),
        getXpressbeesServiceInfo(String(pickupPincode), String(destinationPincode)),
        isDelhiveryServiceable(String(pickupPincode), String(destinationPincode)),
        ekartClient.checkServiceability(destinationPincode)
      ]);

    const availableCouriers: SimpleServiceInfo[] = [];

    if (shadowfaxResult.status === "fulfilled" && shadowfaxResult.value) {
      availableCouriers.push({ courierName: "Shadowfax" });
    }
    if (ecomResult.status === "fulfilled" && ecomResult.value) {
      availableCouriers.push(ecomResult.value);
    }
    if (xpressbeesResult.status === "fulfilled" && xpressbeesResult.value) {
      availableCouriers.push(xpressbeesResult.value);
    }
    if (delhiveryResult.status === "fulfilled" && delhiveryResult.value) {
      availableCouriers.push({ courierName: "Delhivery" });
    }
    if (ekartResult.status === "fulfilled" && ekartResult.value && ekartResult.value.status === true) {
      availableCouriers.push({ courierName: "EKart" });
    }
    if (availableCouriers.length === 0) {
      return NextResponse.json(
        {
          couriers: [],
          message: "No courier service available for the given pincodes.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ couriers: availableCouriers });
  } catch (error: any) {
    console.error("Courier Serviceability API Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch courier serviceability." },
      { status: 500 }
    );
  }
}

// ─── Shadowfax ───────────────────────────────────────────────────────────────

async function isShadowfaxServiceable(
  originPincode: string,
  destinationPincode: string
): Promise<boolean> {
  const serviceabilityUrl = `${process.env.SHADOWFAX_SERVICEABILITY_API_URL}?service=customer_delivery&pincodes=${originPincode},${destinationPincode}`;
  const apiToken = process.env.SHADOWFAX_API_TOKEN;

  if (!process.env.SHADOWFAX_SERVICEABILITY_API_URL || !apiToken) {
    console.error("Shadowfax Serviceability API URL or Token is not configured.");
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

// ─── Ecom Express ────────────────────────────────────────────────────────────

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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (Array.isArray(data) && data.length > 0 && data[0].success) {
      return { courierName: "Ecom Express" };
    } else {
      console.warn(
        "Ecom Express Rate API - Service not available:",
        data[0]?.errors?.reason || data
      );
    }
  } catch (error: any) {
    console.error(
      "Error checking Ecom Express serviceability:",
      error.response?.data || error.message
    );
  }
  return null;
}

// ─── Xpressbees ──────────────────────────────────────────────────────────────

async function getXpressbeesServiceInfo(
  originPincode: string,
  destinationPincode: string
): Promise<SimpleServiceInfo | null> {
  const apiUrl = process.env.XPRESSBEES_RATE_API_URL;
  const loginUrl = process.env.XPRESSBEES_LOGIN_API_URL;
  const email = process.env.XPRESSBEES_EMAIL;
  const password = process.env.XPRESSBEES_PASSWORD;

  if (!apiUrl || !loginUrl || !email || !password) {
    console.error("Xpressbees API URL or credentials are not configured.");
    return null;
  }

  let token: string | null = null;
  try {
    const loginRes = await axios.post(loginUrl, { email, password });
    if (loginRes.data && loginRes.data.status === true && loginRes.data.data) {
      token = loginRes.data.data;
    } else {
      console.error("Xpressbees: Failed to fetch token.");
      return null;
    }
  } catch (err) {
    console.error("Xpressbees: Error fetching token.", err);
    return null;
  }

  const payload = {
    order_type_user: "ecom",
    origin: originPincode,
    destination: destinationPincode,
    weight: "0.5",
    length: "10",
    height: "10",
    breadth: "10",
    cod_amount: "10",
    cod: "no",
    product_value: "50",
  };

  try {
    const { data } = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (
      data &&
      data.status === true &&
      Array.isArray(data.message) &&
      data.message.length > 0
    ) {
      return { courierName: "Xpressbees" };
    }
  } catch (error: any) {
    console.error(
      "Error checking Xpressbees serviceability:",
      error.response?.data || error.message
    );
  }
  return null;
}

// ─── Delhivery ───────────────────────────────────────────────────────────────

async function isDelhiveryServiceable(
  originPincode: string,
  destinationPincode: string
): Promise<boolean> {
  // Use any available Delhivery token to check pin-code serviceability
  const token =
    process.env.DELHIVERY_TOKEN_SURFACE_500G ||
    process.env.DELHIVERY_TOKEN_EXPRESS_500G ||
    process.env.DELHIVERY_TOKEN_SURFACE_2KG ||
    process.env.DELHIVERY_TOKEN_SURFACE_5KG;

  const mode = process.env.DELHIVERY_MODE || "Production";
  const baseUrl =
    mode === "Production"
      ? "https://track.delhivery.com"
      : "https://staging-express.delhivery.com";

  if (!token) {
    console.error("Delhivery: No token configured for serviceability check.");
    return false;
  }

  try {
    const response = await axios.get(`${baseUrl}/c/api/pin-codes/json/`, {
      headers: { Authorization: `Token ${token}` },
      params: { filter_codes: destinationPincode },
    });

    const deliveryCodes = response.data.delivery_codes;
    if (
      !deliveryCodes ||
      !Array.isArray(deliveryCodes) ||
      deliveryCodes.length === 0
    ) {
      return false;
    }

    const firstEntry = deliveryCodes[0];
    const serviceData = firstEntry
      ? (Object.values(firstEntry)[0] as any)
      : null;
    if (!serviceData) return false;

    // Check for embargo
    if (
      serviceData.remark &&
      serviceData.remark.toLowerCase().includes("embargo")
    ) {
      return false;
    }

    // Check if either prepaid or COD is supported
    const canCod = serviceData.cod === "Y" || serviceData.cod === "y";
    const canPrepaid =
      serviceData.pre_paid === "Y" || serviceData.pre_paid === "y";

    return canCod || canPrepaid;
  } catch (error: any) {
    console.error(
      "Error checking Delhivery serviceability:",
      error.response?.data || error.message
    );
  }
  return false;
}