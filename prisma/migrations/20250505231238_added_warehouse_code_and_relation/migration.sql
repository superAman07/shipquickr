/*
  Warnings:

  - A unique constraint covering the columns `[warehouseCode]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warehouseCode` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "warehouseId" INTEGER;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "warehouseCode" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Order_warehouseId_idx" ON "Order"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_warehouseCode_key" ON "Warehouse"("warehouseCode");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
