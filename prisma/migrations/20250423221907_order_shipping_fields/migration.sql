/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'unshipped', 'shipped', 'cancelled');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "awbNumber" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "shippingId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'pending';
