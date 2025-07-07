-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedOtp" TEXT,
ADD COLUMN     "otpExpires" TIMESTAMP(3),
ALTER COLUMN "password" DROP NOT NULL;
