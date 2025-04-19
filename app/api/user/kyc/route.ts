import { prisma } from "@/lib/prisma"; 
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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


export async function POST (req: NextRequest){
    try{
        const cookiesStores = await cookies();
        const token = cookiesStores.get('userToken')?.value;
        if(!token){
            return NextResponse.json({ error: "Token not found" }, { status: 401 });
        }
        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }
        const already = await prisma.kycDetail.findUnique({ where: { userId: parseInt(decoded.userId) } });
        if (already) {
            return NextResponse.json({ error: "KYC already submitted" }, { status: 409 });
        }
        
        const {gst,gstNumber,gstCertificateUrl,shipments,companyName,companyEmail,companyContact,billingAddress,pincode, state, city,website,signatureUrl,companyLogoUrl,kycType,panCardNo,panCardUrl,aadhaarNo,aadhaarFrontUrl,aadhaarBackUrl,accountHolder,bankName,accountType,accountNo,ifsc,chequeUrl} = await req.json();
        if (gst=== undefined || !gstNumber || !gstCertificateUrl || !shipments || !companyName || !companyEmail || !companyContact || !billingAddress || !pincode || !state || !city || !website || !signatureUrl || !companyLogoUrl || !kycType) {
            return NextResponse.json({ error: "All fields must be filled" }, { status: 400 });
        }
        const kyc = await prisma.kycDetail.create({
            data: {
                userId: parseInt(decoded.userId),
                gst,
                gstNumber,
                gstCertificateUrl,
                shipments,
                companyName,
                companyEmail,
                companyContact,
                billingAddress,
                pincode,
                state,
                city,
                website,
                signatureUrl,
                companyLogoUrl,
                kycType,
                panCardNo: panCardNo || null, 
                panCardUrl: panCardUrl || null, 
                aadhaarNo: aadhaarNo || null, 
                aadhaarFrontUrl: aadhaarFrontUrl || null, 
                aadhaarBackUrl: aadhaarBackUrl || null, 
                accountHolder: accountHolder || null, 
                bankName: bankName || null, 
                accountType: accountType || null, 
                accountNo: accountNo || null, 
                ifsc: ifsc || null, 
                chequeUrl: chequeUrl || null, 
            }
        });
        return NextResponse.json({ message: "KYC details submitted successfully", kyc }, { status: 201 });
    }catch(err){
        console.error("KYC POST error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}