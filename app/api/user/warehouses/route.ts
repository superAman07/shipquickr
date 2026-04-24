import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';

interface TokenDetailsType {
    userId: number;
    exp: number;
}
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }
        const data = await req.json();
        const warehouseCode = await generateUniqueWarehouseCode(decoded.userId);
        const warehouse = await prisma.warehouse.create({
            data: {
                ...data,
                userId: decoded.userId,
                warehouseCode: warehouseCode,
                id: undefined
            }
        })

        // Centralized Synchronization with all active Couriers (Delhivery, EKart, etc.)
        // This is safe to run as fire-and-forget or awaited. 
        // We await here to ensure entries are created before returning response.
        const { WarehouseSyncService } = await import("@/lib/services/warehouse-sync");
        await WarehouseSyncService.syncWithAllCouriers(warehouse.id);

        return NextResponse.json({ message: "Warehouse added and synchronized successfully", warehouse }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }

        const warehouses = await prisma.warehouse.findMany({
            where: {
                userId,
                OR: search
                    ? [
                        { warehouseName: { contains: search, mode: "insensitive" } },
                        { city: { contains: search, mode: "insensitive" } },
                        { state: { contains: search, mode: "insensitive" } },
                        { pincode: { contains: search, mode: "insensitive" } },
                    ]
                    : undefined,
            },
            include: {
                syncStatuses: true
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ warehouses });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
    }
}


async function generateUniqueWarehouseCode(userId: number): Promise<string> {
    const timestampSuffix = Date.now().toString().slice(-6);
    const code = `SQW${userId}${timestampSuffix}`;
    return code;
}