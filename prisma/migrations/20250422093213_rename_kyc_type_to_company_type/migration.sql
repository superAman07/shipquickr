/*
  Warnings:

  - You are about to drop the column `kycType` on the `KycDetail` table. All the data in the column will be lost.
  - Added the required column `companyType` to the `KycDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KycDetail" DROP COLUMN "kycType",
ADD COLUMN     "companyType" TEXT NOT NULL;
