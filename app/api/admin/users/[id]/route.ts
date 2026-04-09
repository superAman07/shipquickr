import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("adminToken")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded: any = jwtDecode(token);
        if (decoded.role !== "admin") {
            return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
        }

        const userId = parseInt(params.id);
        if (isNaN(userId) || userId <= 0) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true,
                kycDetail: true,
                _count: {
                    select: { orders: true, transactions: true }
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 15
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        console.error("Deep User Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }
}
