import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { WarehouseSyncService } from "@/lib/services/warehouse-sync";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const warehouseId = parseInt(params.id);
        const userId = decoded.userId;

        // Verify warehouse belongs to user
        const warehouse = await prisma.warehouse.findFirst({
            where: { id: warehouseId, userId }
        });

        if (!warehouse) {
            return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
        }

        // Trigger Sync
        await WarehouseSyncService.syncWithAllCouriers(warehouseId);

        // Fetch updated sync statuses
        const updatedSyncStatuses = await prisma.warehouseCourierSync.findMany({
            where: { warehouseId }
        });

        return NextResponse.json({
            message: "Synchronization triggered",
            syncStatuses: updatedSyncStatuses
        });

    } catch (error) {
        console.error("Manual Sync Error:", error);
        return NextResponse.json({ error: "Failed to sync warehouse" }, { status: 500 });
    }
}
