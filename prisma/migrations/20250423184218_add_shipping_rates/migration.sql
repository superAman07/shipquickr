-- CreateTable
CREATE TABLE "ShippingRates" (
    "id" SERIAL NOT NULL,
    "courierChargesType" TEXT NOT NULL,
    "courierChargesAmount" DOUBLE PRECISION NOT NULL,
    "codChargesType" TEXT NOT NULL,
    "codChargesAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRates_pkey" PRIMARY KEY ("id")
);
