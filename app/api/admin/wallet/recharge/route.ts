import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Ensure accurate environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

interface TokenDetailsType {
  userId: string;
  role: string;
  exp: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    
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

    // Handle Optional File Upload to S3
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `manual-recharge-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_UPLOAD_BUCKET_NAME as string,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          // ACL: "public-read", // Uncomment depending on your bucket permissions
        })
      );

      // Build the S3 Object URL
      receiptUrl = `https://${process.env.S3_UPLOAD_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
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
