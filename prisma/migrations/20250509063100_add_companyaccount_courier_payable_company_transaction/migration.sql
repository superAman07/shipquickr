-- CreateTable
CREATE TABLE "CompanyAccount" (
    "id" SERIAL NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTransaction" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierPayable" (
    "id" SERIAL NOT NULL,
    "courierName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settlementId" INTEGER,

    CONSTRAINT "CourierPayable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourierPayable_orderId_idx" ON "CourierPayable"("orderId");

-- CreateIndex
CREATE INDEX "CourierPayable_courierName_idx" ON "CourierPayable"("courierName");

-- AddForeignKey
ALTER TABLE "CompanyTransaction" ADD CONSTRAINT "CompanyTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CompanyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierPayable" ADD CONSTRAINT "CourierPayable_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
