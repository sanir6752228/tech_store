-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "memory" TEXT,
    "color" TEXT,
    "battery" TEXT,
    "price" INTEGER NOT NULL,
    "oldPrice" INTEGER,
    "description" TEXT,
    "images" TEXT[],
    "telegramVideo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
