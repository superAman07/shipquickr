import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface TokenDetailsType {
  userId: string;
  role: string;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now() || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const targetUserId = formData.get("userId")?.toString();
    const amountStr = formData.get("amount")?.toString();
    const remarks = formData.get("remarks")?.toString();
    const file = formData.get("receipt") as File | null;

    if (!targetUserId || !amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      return NextResponse.json({ error: "Invalid user ID or amount" }, { status: 400 });
    }

    const amount = Number(amountStr);
    let receiptUrl = null;

    // Handle Optional File Upload to Local Storage (Hostinger Compatible)
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(file.name);
      const fileName = `manual-recharge-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

      const isProd = process.env.NODE_ENV === "production";
      const uploadDir = isProd
        ? path.join(process.cwd(), "..", "storage", "uploads", "recharge")
        : path.join(process.cwd(), "storage", "uploads", "recharge");

      // Ensure the directory exists
      await mkdir(uploadDir, { recursive: true });

      // Save the file
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      receiptUrl = `/api/uploads/recharge/${fileName}`;
    }

    // Process DB changes atomically
    await prisma.$transaction(async (tx) => {
      // 1. Update or Create Wallet
      await tx.wallet.upsert({
        where: { userId: parseInt(targetUserId) },
        update: { balance: { increment: amount } },
        create: { userId: parseInt(targetUserId), balance: amount },
      });

      // 2. Log the transaction
      await tx.transaction.create({
        data: {
          userId: parseInt(targetUserId),
          amount: amount,
          type: "recharge",
          status: "Success", // Complete immediately
          remarks: remarks || "Manual recharge by Admin",
          receiptUrl: receiptUrl,
          merchantTransactionId: `ADMINREC${Date.now()}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Wallet recharged successfully" });
  } catch (error: any) {
    console.error("Manual Recharge Error:", error);
    return NextResponse.json({ error: "Failed to process manual recharge" }, { status: 500 });
  }
}
