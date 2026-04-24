import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

interface TokenDetailsType {
    userId: string;
    exp: number;
}

const SYSTEM_COURIERS = [
    "Delhivery Surface",
    "Delhivery Express",
    "Shadowfax",
    "XpressBees",
    "Ecom Express",
    "EKart",
];

export async function GET(req: NextRequest) {
    try {
        const cookiesStores = await cookies();
        const token = cookiesStores.get("userToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const userId = parseInt(decoded.userId);

        const assignments = await prisma.userCourierAssignment.findMany({
            where: { userId },
        });

        // Merge system couriers with user assignments to ensure all couriers are returned
        const result = SYSTEM_COURIERS.map((courierName) => {
            const assignment = assignments.find((a) => a.courier === courierName);
            return {
                courier: courierName,
                isActive: assignment?.isActive ?? false,
                dashboardPriority: assignment?.dashboardPriority ?? 0,
                apiPriority: assignment?.apiPriority ?? 0,
            };
        });

        return NextResponse.json({ couriers: result });
    } catch (error: any) {
        console.error("Error fetching courier priority:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookiesStores = await cookies();
        const token = cookiesStores.get("userToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        const userId = parseInt(decoded.userId);

        const body = await req.json();
        const { couriers } = body; // Array of { courier, isActive, dashboardPriority, apiPriority }

        if (!Array.isArray(couriers)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        await prisma.$transaction(
            couriers.map((c: any) =>
                prisma.userCourierAssignment.upsert({
                    where: {
                        userId_courier: {
                            userId,
                            courier: c.courier,
                        },
                    },
                    update: {
                        isActive: c.isActive,
                        dashboardPriority: parseInt(c.dashboardPriority) || 0,
                        apiPriority: parseInt(c.apiPriority) || 0,
                    },
                    create: {
                        userId,
                        courier: c.courier,
                        isActive: c.isActive,
                        dashboardPriority: parseInt(c.dashboardPriority) || 0,
                        apiPriority: parseInt(c.apiPriority) || 0,
                    },
                })
            )
        );

        return NextResponse.json({ message: "Courier priorities updated successfully" });
    } catch (error: any) {
        console.error("Error updating courier priority:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
