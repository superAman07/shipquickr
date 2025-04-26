-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "remittanceId" INTEGER;

-- CreateTable
CREATE TABLE "Remittance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "remittanceDate" TIMESTAMP(3) NOT NULL,
    "utrReference" TEXT,
    "collectableValue" DOUBLE PRECISION NOT NULL,
    "netOffAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earlyCodCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codPaid" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remittance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Remittance_userId_idx" ON "Remittance"("userId");

-- CreateIndex
CREATE INDEX "Order_remittanceId_idx" ON "Order"("remittanceId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_remittanceId_fkey" FOREIGN KEY ("remittanceId") REFERENCES "Remittance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remittance" ADD CONSTRAINT "Remittance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
