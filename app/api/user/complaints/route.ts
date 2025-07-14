export const runtime = 'nodejs';


import { prisma } from "@/lib/prisma";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { ComplaintStatus } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface TokenDetailsType {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    exp: number;
}

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET_NAME!;
if (!BUCKET_NAME) {
  console.error("Error: S3_UPLOAD_BUCKET_NAME environment variable is not set.");
}

async function saveFile(file: File | null, folder: string): Promise<string | null> {
    if (!file) return null;
 
    const allowedTypes = ["application/pdf", "audio/mpeg", "audio/wav", "audio/ogg", "image/jpeg"];
    const isAllowedType = allowedTypes.some(type => file.type.startsWith(type.split('/')[0] + '/') || file.type === type);

    if (!isAllowedType) {
      console.error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
      throw new Error(`Invalid file type. Only PDF, Audio, or JPG allowed.`);
    }

    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
       console.error(`File size exceeds limit: ${file.size} bytes. Max: ${maxSize} bytes.`);
       throw new Error(`File size exceeds the ${maxSize / 1024 / 1024}MB limit.`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname(file.name);
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`;

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: filename,
          Body: buffer,
          ContentType: file.type,
        },
      });

      await upload.done(); 
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'your-region'}.amazonaws.com/${filename}`;
      console.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("Failed to upload file.");
    }
}

export async function POST(req: NextRequest){
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if(!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decode = jwtDecode<TokenDetailsType>(token);
        if(decode.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });
        const userId = parseInt(decode.userId);

        const formData = await req.formData();
        const awb = formData.get('awb')?.toString();
        const issues = formData.get('issues')?.toString();
        const file = formData.get('file') as File | null;
        if(!awb || !issues) {
            return NextResponse.json({ error: "AWB Number and Issues are required." }, { status: 400 });
        }
        const fileUrl = await saveFile(file, "complaints");
        const complaint = await prisma.complaint.create({
            data: {
                awbNumber: awb,
                issue: issues,
                fileUrl: fileUrl,
                userId: userId,
            }
        });
        return NextResponse.json({ message: "Complaint created successfully", complaint }, { status: 201 });
    }catch (error: any) {
        console.error("Complaint submission error:", error); 
        if (error.message.includes("Invalid file type") || error.message.includes("File size exceeds")) {
             return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message.includes("Failed to upload file")) {
             return NextResponse.json({ error: "Could not upload file. Please try again." }, { status: 500 });
        }
        return NextResponse.json({ error: "Something went wrong during complaint submission." }, { status: 500 });
    }
}


export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const userId = parseInt(decoded.userId);

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const status = searchParams.get("status") as ComplaintStatus | null;
        const searchQuery = searchParams.get("search") || ""; 

        const skip = (page - 1) * pageSize;
 
        const whereClause: any = {
            userId: userId,
        };

        if (status && Object.values(ComplaintStatus).includes(status)) {
            whereClause.status = status;
        }

        if (searchQuery) {
            whereClause.OR = [
                { awbNumber: { contains: searchQuery, mode: 'insensitive' } },
                { issue: { contains: searchQuery, mode: 'insensitive' } }, 
            ];
        }
 
        const [complaints, total] = await prisma.$transaction([
            prisma.complaint.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },  
                skip: skip,
                take: pageSize,
            }),
            prisma.complaint.count({
                where: whereClause,
            }),
        ]);

        return NextResponse.json({
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            complaints,
        });

    } catch (error: any) {
        console.error("Error fetching raised complaints:", error);
        if (error.message.includes("Invalid enum value")) {
             return NextResponse.json({ error: "Invalid status filter provided." }, { status: 400 });
        }
        return NextResponse.json({ error: "Something went wrong while fetching complaints." }, { status: 500 });
    }
}