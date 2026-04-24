-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "WarehouseCourierSync" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "courier" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "errorMessage" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseCourierSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseCourierSync_warehouseId_idx" ON "WarehouseCourierSync"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseCourierSync_warehouseId_courier_key" ON "WarehouseCourierSync"("warehouseId", "courier");

-- AddForeignKey
ALTER TABLE "WarehouseCourierSync" ADD CONSTRAINT "WarehouseCourierSync_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
