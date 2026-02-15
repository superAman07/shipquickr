// export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { ecomExpressClient } from "@/lib/services/ecom-express";
import { delhiveryClient } from "@/lib/services/delhivery";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
interface TokenDetailsType {
  userId: number;
  email: string;
  exp: number;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.error("CRITICAL: S3_UPLOAD_BUCKET_NAME environment variable is not set for label generation.");
}

export async function POST(req: NextRequest) {
  if (!BUCKET_NAME) {
    console.error("Label Generation Error: S3 Bucket name is not configured.");
    return NextResponse.json({ error: "Server configuration error for file storage." }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    const userId = decoded.userId;

    const body = await req.json();
    const { orderId, awbNumber, courierName }: { orderId: number, awbNumber: string, courierName: string } = body;

    if (!orderId || !awbNumber || !courierName) {
      return NextResponse.json({ error: "Missing orderId, awbNumber, or courierName" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId, awbNumber: awbNumber }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or AWB number mismatch." }, { status: 404 });
    }

    if (order.labelUrl) {
      console.log(`Label already exists for order ${orderId}, AWB ${awbNumber}: ${order.labelUrl}`);
    }

    let labelDataUri: string | null = null;

    if (courierName.toLowerCase().includes("ecom express")) {
      console.log(`Generating Ecom Express label for AWB: ${awbNumber}`);
      console.log("Waiting for 2 seconds to ensure manifest is processed...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      labelDataUri = await ecomExpressClient.generateShippingLabel([awbNumber]);
    } else if (courierName.toLowerCase().includes("xpressbees")) {
      console.warn("Xpressbees label generation is not yet implemented.");
      return NextResponse.json({ error: "Xpressbees label generation not implemented." }, { status: 501 });
    } else if (courierName.toLowerCase().includes("delhivery")) {
      console.log(`Generating Delhivery label for AWB: ${awbNumber}`);
      const result = await delhiveryClient.generateLabel(awbNumber);

      if (result.success && result.url) {
        // Need to fetch the PDF content from the URL to upload to S3
        // Since `labelDataUri` expects base64 or similar to trigger the upload logic,
        // let's fetch it here and convert to base64.
        try {
          const response = await fetch(result.url);
          if (!response.ok) throw new Error(`Failed to fetch PDF from Delhivery: ${response.statusText}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          labelDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
        } catch (err) {
          console.error("Error fetching Delhivery Label PDF:", err);
          return NextResponse.json({ error: "Failed to download label from Delhivery." }, { status: 502 });
        }
      } else {
        return NextResponse.json({ error: result.message || "Failed to generate label." }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported courier for label generation." }, { status: 400 });
    }

    if (!labelDataUri || !labelDataUri.startsWith('data:application/pdf;base64,')) {
      console.error(`Failed to generate or received invalid label data for AWB: ${awbNumber}. Data: ${labelDataUri}`);
      return NextResponse.json({ error: `Failed to generate label for AWB: ${awbNumber}. Invalid data received.` }, { status: 500 });
    }

    const base64Pdf = labelDataUri.split(',')[1];
    const pdfBuffer = Buffer.from(base64Pdf, 'base64');

    const sanitizedAwb = awbNumber.replace(/[^a-zA-Z0-9-_]/g, '');
    const s3FileName = `labels/ecom/${sanitizedAwb}-${orderId}-${Date.now()}.pdf`;

    console.log(`Uploading label to S3: ${s3FileName} for order ${orderId}`);

    const putObjectParams = {
      Bucket: BUCKET_NAME,
      Key: s3FileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    };

    await s3Client.send(new PutObjectCommand(putObjectParams));
    console.log(`Successfully uploaded ${s3FileName} to ${BUCKET_NAME}.`);

    const s3Region = process.env.AWS_REGION || s3Client.config.region || "ap-south-1"; // Ensure region is available
    const finalLabelUrl = `https://${BUCKET_NAME}.s3.${s3Region}.amazonaws.com/${s3FileName}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { labelUrl: finalLabelUrl }
    });

    console.log(`Updated order ${orderId} with label URL: ${finalLabelUrl}`);
    return NextResponse.json({ success: true, labelUrl: finalLabelUrl, message: "Shipping label generated, uploaded to S3, and order updated." });

  } catch (error: any) {
    console.error("Error generating shipping label (API Route):", error);
    let errorMessage = "Failed to generate shipping label due to an unexpected error.";
    if (error.message) {
    }
    if (error.name === 'NoSuchBucket') {
      errorMessage = "File storage bucket not found. Please contact support.";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}