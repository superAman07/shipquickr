import { prisma } from "@/lib/prisma";
import { delhiveryClient } from "./delhivery";
import { ekartClient } from "./ekart";
import { xpressbeesClient } from "./xpressbees";
import axios from "axios";

export class WarehouseSyncService {
    /**
     * Synchronizes a single warehouse with all active/supported courier partners.
     */
    static async syncWithAllCouriers(warehouseId: number) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId },
        });

        if (!warehouse) {
            console.error(`Sync failed: Warehouse ${warehouseId} not found.`);
            return;
        }

        console.log(`Starting dynamic sync for Warehouse: ${warehouse.warehouseName} (${warehouseId})`);

        // 1. Delhivery Sync (using existing logic but refactored here)
        await this.syncWithDelhivery(warehouse);

        // 2. EKart Sync (using new registerWarehouse method)
        await this.syncWithEkart(warehouse);

        // 3. XpressBees Sync (Placeholder - logic needed once user provides API)
        // await this.syncWithXpressBees(warehouse);
    }

    private static async syncWithDelhivery(warehouse: any) {
        const courierName = "DELHIVERY";
        const allTokens = [
            process.env.DELHIVERY_TOKEN_SURFACE_500G,
            process.env.DELHIVERY_TOKEN_SURFACE_2KG,
            process.env.DELHIVERY_TOKEN_SURFACE_5KG,
            process.env.DELHIVERY_TOKEN_EXPRESS_500G,
        ].filter(Boolean);

        let success = true;
        let errorMessage = "";

        if (allTokens.length === 0) {
            success = false;
            errorMessage = "No Delhivery tokens configured in environment.";
        }

        for (const token of allTokens) {
            try {
                const res = await axios.post(
                    'https://track.delhivery.com/api/backend/clientwarehouse/create/',
                    {
                        name: warehouse.warehouseName,
                        phone: warehouse.mobile,
                        address: `${warehouse.address1}${warehouse.address2 ? ', ' + warehouse.address2 : ''}`,
                        city: warehouse.city,
                        pin: warehouse.pincode,
                        state: warehouse.state,
                        country: 'India',
                        registered_name: warehouse.warehouseName,
                        return_address: `${warehouse.address1}${warehouse.address2 ? ', ' + warehouse.address2 : ''}`,
                        return_pin: warehouse.pincode,
                        return_city: warehouse.city,
                        return_state: warehouse.state,
                        return_country: 'India'
                    },
                    { headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
                );

                if (!res.data?.success && res.data?.error) {
                    const errorStr = typeof res.data.error === 'string' ? res.data.error : JSON.stringify(res.data.error);
                    if (errorStr.toLowerCase().includes("already exists") || errorStr.toLowerCase().includes("duplicate")) {
                        // It is already registered on Delhivery! We count this as a SUCCESS.
                    } else {
                        success = false;
                        errorMessage += `(Token ${token?.slice(0, 5)}): ${errorStr}. `;
                    }
                }
            } catch (e: any) {
                const errorStr = typeof e.response?.data?.error === 'string' ? e.response.data.error : JSON.stringify(e.response?.data?.error || e.message);
                if (errorStr.toLowerCase().includes("already exists") || errorStr.toLowerCase().includes("duplicate")) {
                    // Count as SUCCESS
                } else {
                    success = false;
                    errorMessage += `(Token ${token?.slice(0, 5)}): ${errorStr}. `;
                }
            }
        }

        await this.updateSyncStatus(warehouse.id, courierName, success ? "SUCCESS" : "FAILED", null, errorMessage);
    }

    private static async syncWithEkart(warehouse: any) {
        const courierName = "EKART";
        try {
            const result = await ekartClient.registerWarehouse(warehouse);
            let status: "SUCCESS" | "FAILED" = result.success ? "SUCCESS" : "FAILED";
            let msg = result.success ? "" : result.message;

            if (!result.success && result.message.toLowerCase().includes("already exists")) {
                status = "SUCCESS";
                msg = "";
            }

            await this.updateSyncStatus(
                warehouse.id,
                courierName,
                status,
                result.alias || warehouse.warehouseName,
                msg
            );
        } catch (error: any) {
            let status: "SUCCESS" | "FAILED" = "FAILED";
            let msg = error.message;
            if (msg.toLowerCase().includes("already exists")) {
                status = "SUCCESS";
                msg = "";
            }
            await this.updateSyncStatus(warehouse.id, courierName, status, warehouse.warehouseName, msg);
        }
    }

    private static async updateSyncStatus(warehouseId: number, courier: string, status: "SUCCESS" | "FAILED" | "PENDING", externalId: string | null, errorMessage: string | null) {
        try {
            await prisma.warehouseCourierSync.upsert({
                where: {
                    warehouseId_courier: {
                        warehouseId,
                        courier,
                    },
                },
                update: {
                    status,
                    externalId,
                    errorMessage: errorMessage?.substring(0, 500),
                    lastSyncAt: new Date(),
                },
                create: {
                    warehouseId,
                    courier,
                    status,
                    externalId,
                    errorMessage: errorMessage?.substring(0, 500),
                },
            });
        } catch (e) {
            console.error(`Failed to update sync status for ${courier}:`, e);
        }
    }
}
