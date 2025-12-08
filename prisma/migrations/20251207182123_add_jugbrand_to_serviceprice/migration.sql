/*
  Warnings:

  - A unique constraint covering the columns `[name,method,waterTypeId,jugBrandId]` on the table `ServicePrice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ServicePrice_name_method_waterTypeId_key";

-- AlterTable
ALTER TABLE "ServicePrice" ADD COLUMN     "jugBrandId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_name_method_waterTypeId_jugBrandId_key" ON "ServicePrice"("name", "method", "waterTypeId", "jugBrandId");

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_jugBrandId_fkey" FOREIGN KEY ("jugBrandId") REFERENCES "JugBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
