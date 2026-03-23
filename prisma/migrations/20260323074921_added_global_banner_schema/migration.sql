-- CreateTable
CREATE TABLE "GlobalBanner" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "backgroundColor" TEXT DEFAULT 'bg-[linear-gradient(to_right,#f59e0b,#ea580c)]',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalBanner_pkey" PRIMARY KEY ("id")
);
