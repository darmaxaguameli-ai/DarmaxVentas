/*
  Warnings:

  - You are about to drop the column `productoId` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the `Producto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_productoId_fkey";

-- DropIndex
DROP INDEX "PedidoItem_pedidoId_productoId_key";

-- AlterTable
ALTER TABLE "PedidoItem" DROP COLUMN "productoId",
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "servicePriceId" TEXT;

-- DropTable
DROP TABLE "Producto";

-- CreateTable
CREATE TABLE "WaterType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WaterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "waterTypeId" TEXT,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JugBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "compatibleCapId" TEXT,

    CONSTRAINT "JugBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "category" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaterType_name_key" ON "WaterType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_name_method_waterTypeId_key" ON "ServicePrice"("name", "method", "waterTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "JugBrand_name_key" ON "JugBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_waterTypeId_fkey" FOREIGN KEY ("waterTypeId") REFERENCES "WaterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JugBrand" ADD CONSTRAINT "JugBrand_compatibleCapId_fkey" FOREIGN KEY ("compatibleCapId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_servicePriceId_fkey" FOREIGN KEY ("servicePriceId") REFERENCES "ServicePrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
