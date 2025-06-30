/*
  Warnings:

  - You are about to drop the column `razorpayOrderId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[merchantTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
ADD COLUMN     "merchantTransactionId" TEXT,
ADD COLUMN     "providerReferenceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_merchantTransactionId_key" ON "Transaction"("merchantTransactionId");
