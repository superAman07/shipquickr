/*
  Warnings:

  - Added the required column `mobile` to the `KycDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KycDetail" ADD COLUMN     "mobile" TEXT NOT NULL;
