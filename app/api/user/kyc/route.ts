import { prisma } from "@/lib/prisma"; 
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";
import path from "path";


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



export const config = {
    api: {
      bodyParser: false,
    },
  };
  
function saveFile(file: FormidableFile, folder: string) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "kyc");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const ext = path.extname(file.originalFilename || "");
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const fileData = fs.readFileSync(file.filepath);
    fs.writeFileSync(filepath, fileData);
    return `/uploads/kyc/${filename}`;
}
  
export async function POST(req: NextRequest) {
    try {
      const cookiesStores = await cookies();
      const token = cookiesStores.get("userToken")?.value;
      if (!token) return NextResponse.json({ error: "Token not found" }, { status: 401 });
      const decoded = jwtDecode<any>(token);
      if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });
   
      const formData = await req.formData();
   
      async function saveFile(file: File | null, folder: string) {
        if (!file) return null;
        if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
          throw new Error("Only images or PDF allowed");
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = path.extname(file.name);
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "kyc");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);
        return `/uploads/kyc/${filename}`;
      }
   
      const gstCertificateUrl = await saveFile(formData.get("gstCertificate") as File, "kyc");
      const signatureUrl = await saveFile(formData.get("signature") as File, "kyc");
      const companyLogoUrl = await saveFile(formData.get("companyLogo") as File, "kyc");
      const panCardUrl = await saveFile(formData.get("panCardFile") as File, "kyc");
      const aadhaarFrontUrl = await saveFile(formData.get("aadhaarFront") as File, "kyc");
      const aadhaarBackUrl = await saveFile(formData.get("aadhaarBack") as File, "kyc");
      const chequeUrl = await saveFile(formData.get("cheque") as File, "kyc");
   
      const already = await prisma.kycDetail.findUnique({ where: { userId: parseInt(decoded.userId) } });
      if (already) return NextResponse.json({ error: "KYC already submitted" }, { status: 409 });
   
      const kyc = await prisma.kycDetail.create({
        data: {
          userId: parseInt(decoded.userId),
          mobile: formData.get("mobile")?.toString() || "",
          gst: formData.get("gst") === "yes",
          gstNumber: formData.get("gstNumber")?.toString() || "",
          gstCertificateUrl,
          shipments: formData.get("shipments")?.toString() || "",
          companyName: formData.get("companyName")?.toString() || "",
          companyEmail: formData.get("companyEmail")?.toString() || "",
          companyContact: formData.get("companyContact")?.toString() || "",
          billingAddress: formData.get("billingAddress")?.toString() || "",
          pincode: formData.get("pincode")?.toString() || "",
          state: formData.get("state")?.toString() || "",
          city: formData.get("city")?.toString() || "",
          website: formData.get("website")?.toString() || "",
          signatureUrl,
          companyLogoUrl,
          companyType: formData.get("companyType")?.toString() || "",
          panCardNo: formData.get("panCardNo")?.toString() || "",
          panCardUrl,
          aadhaarNo: formData.get("aadhaarNo")?.toString() || "",
          aadhaarFrontUrl,
          aadhaarBackUrl,
          accountHolder: formData.get("accountHolder")?.toString() || "",
          bankName: formData.get("bankName")?.toString() || "",
          accountType: formData.get("accountType")?.toString() || "",
          accountNo: formData.get("accountNo")?.toString() || "",
          ifsc: formData.get("ifsc")?.toString() || "",
          chequeUrl,
        },
      });
  
      return NextResponse.json({ message: "KYC details submitted successfully", kyc }, { status: 201 });
    } catch (err) {
      console.error("KYC POST error:", err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  }



// export async function POST (req: NextRequest){
//     try{
//         const cookiesStores = await cookies();
//         const token = cookiesStores.get('userToken')?.value;
//         if(!token){
//             return NextResponse.json({ error: "Token not found" }, { status: 401 });
//         }
//         const decoded = jwtDecode<TokenDetailsType>(token);
//         if (decoded.exp * 1000 < Date.now()) {
//             return NextResponse.json({ error: "Token expired" }, { status: 401 });
//         }
//         const already = await prisma.kycDetail.findUnique({ where: { userId: parseInt(decoded.userId) } });
//         if (already) {
//             return NextResponse.json({ error: "KYC already submitted" }, { status: 409 });
//         }

//         const {mobile,gst,gstNumber,gstCertificateUrl,shipments,companyName,companyEmail,companyContact,billingAddress,pincode, state, city,website,signatureUrl,companyLogoUrl,companyType,panCardNo,panCardUrl,aadhaarNo,aadhaarFrontUrl,aadhaarBackUrl,accountHolder,bankName,accountType,accountNo,ifsc,chequeUrl} = await req.json();
//         if (gst=== undefined || !gstNumber || !gstCertificateUrl || !shipments || !companyName || !companyEmail || !companyContact || !billingAddress || !pincode || !state || !city || !website || !signatureUrl || !companyLogoUrl || !companyType) {
//             return NextResponse.json({ error: "All fields must be filled" }, { status: 400 });
//         }
//         const kyc = await prisma.kycDetail.create({
//             data: {
//                 userId: parseInt(decoded.userId),
//                 mobile,
//                 gst,
//                 gstNumber,
//                 gstCertificateUrl,
//                 shipments,
//                 companyName,
//                 companyEmail,
//                 companyContact,
//                 billingAddress,
//                 pincode,
//                 state,
//                 city,
//                 website,
//                 signatureUrl,
//                 companyLogoUrl,
//                 companyType,
//                 panCardNo: panCardNo || null, 
//                 panCardUrl: panCardUrl || null, 
//                 aadhaarNo: aadhaarNo || null, 
//                 aadhaarFrontUrl: aadhaarFrontUrl || null, 
//                 aadhaarBackUrl: aadhaarBackUrl || null, 
//                 accountHolder: accountHolder || null, 
//                 bankName: bankName || null, 
//                 accountType: accountType || null, 
//                 accountNo: accountNo || null, 
//                 ifsc: ifsc || null, 
//                 chequeUrl: chequeUrl || null, 
//             }
//         });
//         return NextResponse.json({ message: "KYC details submitted successfully", kyc }, { status: 201 });
//     }catch(err){
//         console.error("KYC POST error:", err);
//         return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
//     }
// }