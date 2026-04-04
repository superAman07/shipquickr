// export const runtime = 'nodejs';
import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

interface TokenDetailsType {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  exp: number;
}

export async function GET() {
  try {
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
      }, select: {
        kycStatus: true
      }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ kycStatus: user.kycStatus }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching KYC status:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};


export async function POST(req: NextRequest) {
  try {
    const cookiesStores = await cookies();
    const token = cookiesStores.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Token not found" }, { status: 401 });
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

    const formData = await req.formData();

    async function saveFile(file: File | null, folder: string): Promise<string | null> {
      if (!file) return null;

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        console.error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
        throw new Error(`Invalid file type. Only ${allowedTypes.join(', ')} allowed.`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error(`File size exceeds limit: ${file.size} bytes. Max: ${maxSize} bytes.`);
        throw new Error(`File size exceeds the ${maxSize / 1024 / 1024}MB limit.`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(file.name);
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

      try {
        // Define the absolute upload directory (e.g., public/uploads/kyc)
        const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

        // Ensure the directory exists
        await mkdir(uploadDir, { recursive: true });

        // Write the file locally
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        console.log(`Successfully saved ${filename} locally to ${uploadDir}.`);

        // Return the public URL for accessing the file
        return `/uploads/${folder}/${filename}`;
      } catch (error) {
        console.error(`Error saving ${filename} locally:`, error);
        if (error instanceof Error) {
          throw new Error(`${error.message}\n${error.stack}`);
        }
        throw new Error(JSON.stringify(error));
      }
    }

    const gstCertificateUrl = await saveFile(formData.get("gstCertificate") as File | null, "kyc");
    const signatureUrl = await saveFile(formData.get("signature") as File | null, "kyc");
    const companyLogoUrl = await saveFile(formData.get("companyLogo") as File | null, "kyc");
    const panCardUrl = await saveFile(formData.get("panCardFile") as File | null, "kyc");
    const aadhaarFrontUrl = await saveFile(formData.get("aadhaarFront") as File | null, "kyc");
    const aadhaarBackUrl = await saveFile(formData.get("aadhaarBack") as File | null, "kyc");
    const chequeUrl = await saveFile(formData.get("cheque") as File | null, "kyc");

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
    await prisma.user.update({
      where: { id: parseInt(decoded.userId) },
      data: { kycStatus: "pending" },
    });
    return NextResponse.json({ message: "KYC details submitted successfully", kyc }, { status: 201 });
  } catch (err: any) {
    console.error("KYC POST error:", err);
    const errorMessage = err.message || "Something went wrong during KYC submission.";
    const statusCode = err.status || 500;
    // return NextResponse.json({ error: errorMessage }, { status: statusCode });
    return NextResponse.json({ error: err?.message || "Something went wrong", details: err }, { status: 500 });
  }
}