import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { ComplaintStatus } from "@prisma/client";

interface TokenDetailsType {
    userId: string;
    role: string;
    exp: number;
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("adminToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now() || decoded.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const status = searchParams.get("status") as ComplaintStatus | null;
        const searchQuery = searchParams.get("search") || "";

        const skip = (page - 1) * pageSize;

        const whereClause: any = {};

        if (status && Object.values(ComplaintStatus).includes(status)) {
            whereClause.status = status;
        }

        if (searchQuery) {
            whereClause.OR = [
                { awbNumber: { contains: searchQuery, mode: 'insensitive' } },
                { issue: { contains: searchQuery, mode: 'insensitive' } },
                { user: { email: { contains: searchQuery, mode: 'insensitive' } } },
                { user: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
                { user: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
            ];
        }

        const [complaints, total] = await prisma.$transaction([
            prisma.complaint.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip: skip,
                take: pageSize,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                }
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
        console.error("Error fetching admin complaints:", error);
        return NextResponse.json({ error: "Something went wrong while fetching complaints." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("adminToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now() || decoded.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const body = await req.json();
        const { complaintId, status, remarks } = body;

        if (!complaintId || !status) {
            return NextResponse.json({ error: "Complaint ID and status are required." }, { status: 400 });
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: parseInt(complaintId) },
            data: {
                status: status as ComplaintStatus,
                adminRemarks: remarks,
            },
        });

        return NextResponse.json({ message: "Complaint updated successfully", complaint: updatedComplaint });

    } catch (error: any) {
        console.error("Error updating complaint:", error);
        return NextResponse.json({ error: "Failed to update complaint." }, { status: 500 });
    }
}
