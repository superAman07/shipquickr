-- AlterEnum
ALTER TYPE "KycStatus" ADD VALUE 'none';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "kycStatus" DROP NOT NULL,
ALTER COLUMN "kycStatus" DROP DEFAULT;
