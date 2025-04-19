import { prisma } from "@/lib/prisma"; 
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface TokenDetailsType {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    exp: number;
}
export async function GET(){ 
    try{
        const cookiesStores = await cookies();
        const token = cookiesStores.get('userToken')?.value; 
        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 401 });
        }
        const decoded = jwtDecode<TokenDetailsType>(token) 
        if (decoded.exp * 1000 < Date.now()) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(decoded.userId)
            },select: {
                kycStatus: true
            }
        }) 
        if(!user){
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ kycStatus: user.kycStatus }, { status: 200 });
    }catch (err: any) {
        console.error("Error fetching KYC status:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}