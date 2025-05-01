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
    
    const shipment = await req.json();
    
    // Call Ecom Express client to generate AWB
    const awbData = await ecomExpressClient.generateAWB(shipment);
    
    return NextResponse.json(awbData);
  } catch (error: any) {
    console.error("AWB Generation error:", error);
    return NextResponse.json({ error: "Failed to generate AWB" }, { status: 500 });
  }
}