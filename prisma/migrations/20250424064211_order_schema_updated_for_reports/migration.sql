/*
  Warnings:

  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'delivered';
ALTER TYPE "OrderStatus" ADD VALUE 'undelivered';
ALTER TYPE "OrderStatus" ADD VALUE 'rto_intransit';
ALTER TYPE "OrderStatus" ADD VALUE 'rto_delivered';
ALTER TYPE "OrderStatus" ADD VALUE 'lost_shipment';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ageing" INTEGER,
ADD COLUMN     "attempts" INTEGER,
ADD COLUMN     "billableWeight" DOUBLE PRECISION,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "shippingDetails" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
