-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundDueDate" TIMESTAMP(3),
ADD COLUMN     "refundStatus" TEXT DEFAULT 'none';
