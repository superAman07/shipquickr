/*
  Warnings:

  - Made the column `kycStatus` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "kycStatus" SET NOT NULL;
