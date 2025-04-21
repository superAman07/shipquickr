-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderValue" DOUBLE PRECISION NOT NULL,
    "hsn" TEXT,
    "physicalWeight" DOUBLE PRECISION NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "breadth" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
