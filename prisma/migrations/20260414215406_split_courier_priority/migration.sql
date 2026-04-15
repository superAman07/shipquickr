/*
  Warnings:

  - You are about to drop the column `priority` on the `UserCourierAssignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserCourierAssignment" DROP COLUMN "priority",
ADD COLUMN     "apiPriority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dashboardPriority" INTEGER NOT NULL DEFAULT 0;
