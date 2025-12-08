/*
  Warnings:

  - You are about to drop the column `jugBrandId` on the `ServicePrice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,method,waterTypeId]` on the table `ServicePrice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ServicePrice" DROP CONSTRAINT "ServicePrice_jugBrandId_fkey";

-- DropIndex
DROP INDEX "ServicePrice_name_method_waterTypeId_jugBrandId_key";

-- AlterTable
ALTER TABLE "ServicePrice" DROP COLUMN "jugBrandId";

-- CreateTable
CREATE TABLE "_JugBrandToServicePrice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JugBrandToServicePrice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_JugBrandToServicePrice_B_index" ON "_JugBrandToServicePrice"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_name_method_waterTypeId_key" ON "ServicePrice"("name", "method", "waterTypeId");

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_A_fkey" FOREIGN KEY ("A") REFERENCES "JugBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_B_fkey" FOREIGN KEY ("B") REFERENCES "ServicePrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
