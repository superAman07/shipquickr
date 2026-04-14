import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

interface TokenDetailsType {
    userId: string;
    exp: number;
}

export async function PUT(req: NextRequest) {
    try {
        const cookiesStores = await cookies();
        const token = cookiesStores.get("userToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const userId = parseInt(decoded.userId);
        const formData = await req.formData();

        async function saveFile(file: File | null, folder: string): Promise<string | null> {
            if (!file) return null;

            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Invalid file type. Only JPG, PNG, and PDF allowed.");
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error("File size exceeds 5MB limit.");
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = path.extname(file.name);
            const filename = `${Date.now()}_cheque${ext}`;

            const isProd = process.env.NODE_ENV === "production";
            const uploadDir = isProd
                ? path.join(process.cwd(), "..", "storage", "uploads", folder)
                : path.join(process.cwd(), "storage", "uploads", folder);

            await mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);

            return `/api/uploads/${folder}/${filename}`;
        }

        const chequeFile = formData.get("cheque") as File | null;
        let chequeUrl = formData.get("existingChequeUrl")?.toString() || null;

        if (chequeFile) {
            chequeUrl = await saveFile(chequeFile, "kyc");
        }

        const updatedKyc = await prisma.kycDetail.update({
            where: { userId },
            data: {
                accountHolder: formData.get("accountHolder")?.toString(),
                bankName: formData.get("bankName")?.toString(),
                accountNo: formData.get("accountNo")?.toString(),
                ifsc: formData.get("ifsc")?.toString(),
                accountType: formData.get("accountType")?.toString() || "saving",
                chequeUrl: chequeUrl,
            },
        });

        return NextResponse.json({ message: "Bank details updated successfully", kyc: updatedKyc }, { status: 200 });
    } catch (err: any) {
        console.error("Bank details update error:", err);
        return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
    }
}
