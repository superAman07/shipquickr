-- CreateTable
CREATE TABLE "KycDetail" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gst" BOOLEAN NOT NULL,
    "gstNumber" TEXT,
    "gstCertificateUrl" TEXT,
    "shipments" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyContact" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "signatureUrl" TEXT,
    "companyLogoUrl" TEXT,
    "kycType" TEXT NOT NULL,
    "panCardNo" TEXT NOT NULL,
    "panCardUrl" TEXT,
    "aadhaarNo" TEXT NOT NULL,
    "aadhaarFrontUrl" TEXT,
    "aadhaarBackUrl" TEXT,
    "accountHolder" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "chequeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KycDetail_userId_key" ON "KycDetail"("userId");

-- AddForeignKey
ALTER TABLE "KycDetail" ADD CONSTRAINT "KycDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
