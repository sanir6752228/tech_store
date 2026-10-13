-- CreateTable
CREATE TABLE "Repair" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactMethod" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "deviceType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "problem" TEXT NOT NULL,
    "description" TEXT,
    "photos" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Новая',
    "adminComment" TEXT,
    "price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repair_pkey" PRIMARY KEY ("id")
);
