-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
