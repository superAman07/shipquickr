import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}
export async function POST(req: NextRequest){
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if(!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const decoded = jwtDecode<TokenDetailsType>(token)
        if(decoded.exp * 1000 < Date.now()){
            return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
        }
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }
        const data = await req.json();
        const order = await prisma.order.create({
            data: {
                ...data,
                userId: decoded.userId
            }
        })
        return NextResponse.json(order, { status: 201 });
    }catch (error){
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });  
    }
}
export async function GET(req: NextRequest) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("userToken")?.value;
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const decoded = jwtDecode<TokenDetailsType>(token);
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
  
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }
      const orders = await prisma.order.findMany({
        where: { userId: decoded.userId },
        orderBy: { createdAt: "desc" },
      });
  
      return NextResponse.json({ orders });
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}