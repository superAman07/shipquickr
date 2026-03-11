-- CreateTable
CREATE TABLE "UserCourierAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courier" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCourierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCourierAssignment_userId_idx" ON "UserCourierAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourierAssignment_userId_courier_key" ON "UserCourierAssignment"("userId", "courier");

-- AddForeignKey
ALTER TABLE "UserCourierAssignment" ADD CONSTRAINT "UserCourierAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
