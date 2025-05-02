import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const l = parseFloat(body.length) || 0;
  const w = parseFloat(body.width)  || 0;
  const h = parseFloat(body.height) || 0;
  const actual = parseFloat(body.weight) || 0;
  const volumetric = (l * w * h) / 5000;
  const cw = Math.max(actual, volumetric, 1); 

  const shipment = {
    orginPincode: parseInt(body.pickupPincode),
    destinationPincode: parseInt(body.destinationPincode),
    productType: body.paymentMode === "COD" ? "cod" : "ppd",
    chargeableWeight: cw,
    codAmount: body.paymentMode === "COD" 
      ? parseFloat(body.collectableValue) || 0 
      : 0
  }; 

  const formData = new URLSearchParams();
  formData.append("username", process.env.ECOM_EXPRESS_USERNAME || "");
  formData.append("password", process.env.ECOM_EXPRESS_PASSWORD || "");
  formData.append("json_input", JSON.stringify([shipment]));

  try {
    const { data } = await axios.post(
      process.env.ECOM_EXPRESS_RATE_API_URL || "",
      formData
    ); 
    if (Array.isArray(data) && data.length > 0 && data[0].success) { 
      const rates = data.map((r: any) => { 
        const breakup = r.chargesBreakup || {}; 
        return {
          courierName: "Ecom Express",
          weight: cw, 
          courierCharges: parseFloat(breakup.FRT) || 0, 
          codCharges: parseFloat(breakup.COD) || 0,  
          totalPrice: parseFloat(breakup.total_charge) || 0, 
        };
      }); 
      return NextResponse.json({ rates });
    } else if (Array.isArray(data) && data.length > 0 && !data[0].success) {
      console.error("Ecom API returned error:", data[0].errors);
      return NextResponse.json({ error: data[0].errors?.reason || "Ecom API Error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected API response format" }, { status: 500 });
  } catch (e: any) {
    console.error("Ecom Error:", e.response?.data || e.message);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}