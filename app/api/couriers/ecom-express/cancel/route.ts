import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { ecomExpressClient } from "@/lib/services/ecom-express";

interface TokenDetailsType {
  userId: number;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    
    const { awbNumber } = await req.json();
    if (!awbNumber) {
      return NextResponse.json({ error: "AWB number is required" }, { status: 400 });
    }
    
    // Call Ecom Express cancel API
    const cancelData = await ecomExpressClient.cancelShipment(awbNumber);
    
    return NextResponse.json({ cancel: cancelData });
  } catch (error: any) {
    console.error("Cancel shipment error:", error);
    return NextResponse.json({ error: "Failed to cancel shipment" }, { status: 500 });
  }
}