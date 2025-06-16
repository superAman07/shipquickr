import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.error("Error: S3_UPLOAD_BUCKET_NAME environment variable is not set in app/api/admin/kyc/route.ts.");
}

async function deleteS3Object(fileUrl: string | null) {
  if (!fileUrl || !BUCKET_NAME) {
    return;
  }

  try {
    const url = new URL(fileUrl);
    const s3Key = url.pathname.substring(1);  

    if (!s3Key) {
        console.warn(`Could not extract S3 key from URL: ${fileUrl}`);
        return;
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted ${s3Key} from S3 bucket ${BUCKET_NAME}`);
  } catch (error) {
    console.error(`Failed to delete ${fileUrl} from S3:`, error); 
  }
}

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        kycStatus: true,
        role: true,
        createdAt: true,
      },
      where: {
        role: 'user', 
        NOT: { kycStatus: undefined },  
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching KYC users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch KYC users' },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ success: false, message: "Missing userId or status" }, { status: 400 });
    }

    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
        return NextResponse.json({ success: false, message: "Invalid userId format" }, { status: 400 });
    }

    if (status.toLowerCase() === 'rejected') { 
      const kycDetails = await prisma.kycDetail.findUnique({
        where: { userId: numericUserId },
      });

      if (kycDetails) { 
        const filesToDelete = [
          kycDetails.panCardUrl,
          kycDetails.aadhaarFrontUrl,
          kycDetails.aadhaarBackUrl,
          kycDetails.gstCertificateUrl,
          kycDetails.signatureUrl,
          kycDetails.companyLogoUrl,
          kycDetails.chequeUrl,
        ];

        for (const fileUrl of filesToDelete) {
          if (fileUrl) {  
            await deleteS3Object(fileUrl);
          }
        } 
        await prisma.kycDetail.deleteMany({
          where: { userId: numericUserId },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { kycStatus: status.toLowerCase() },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update KYC status' },
      { status: 500 }
    );
  }
}