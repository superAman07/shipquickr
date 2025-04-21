/*
  Warnings:

  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "codAmount" DOUBLE PRECISION,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "mobile" TEXT NOT NULL,
ALTER COLUMN "pickupLocation" DROP NOT NULL;
