/*
  Warnings:

  - You are about to drop the column `category` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `hsn` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderValue` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "category",
DROP COLUMN "hsn",
DROP COLUMN "orderValue",
DROP COLUMN "productName",
DROP COLUMN "quantity";

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderValue" DOUBLE PRECISION NOT NULL,
    "hsn" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
