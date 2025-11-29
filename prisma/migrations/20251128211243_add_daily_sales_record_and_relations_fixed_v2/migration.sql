/*
  Warnings:

  - A unique constraint covering the columns `[dailySalesRecordId]` on the table `Ingreso` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "dailySalesRecordId" TEXT;

-- CreateTable
CREATE TABLE "DailySalesRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mostradorColor" INTEGER NOT NULL DEFAULT 0,
    "mostradorBon" INTEGER NOT NULL DEFAULT 0,
    "mostradorEpura" INTEGER NOT NULL DEFAULT 0,
    "mostradorCiel" INTEGER NOT NULL DEFAULT 0,
    "mostradorElectro" INTEGER NOT NULL DEFAULT 0,
    "mostrador10Lts" INTEGER NOT NULL DEFAULT 0,
    "mostradorVtaG" INTEGER NOT NULL DEFAULT 0,
    "mostradorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pedidosColor" INTEGER NOT NULL DEFAULT 0,
    "pedidosBon" INTEGER NOT NULL DEFAULT 0,
    "pedidosEpura" INTEGER NOT NULL DEFAULT 0,
    "pedidosCiel" INTEGER NOT NULL DEFAULT 0,
    "pedidosElectro" INTEGER NOT NULL DEFAULT 0,
    "pedidos10Lts" INTEGER NOT NULL DEFAULT 0,
    "pedidosVtaG" INTEGER NOT NULL DEFAULT 0,
    "pedidosTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negociosColor" INTEGER NOT NULL DEFAULT 0,
    "negociosBon" INTEGER NOT NULL DEFAULT 0,
    "negociosEpura" INTEGER NOT NULL DEFAULT 0,
    "negociosCiel" INTEGER NOT NULL DEFAULT 0,
    "negociosElectro" INTEGER NOT NULL DEFAULT 0,
    "negocios10Lts" INTEGER NOT NULL DEFAULT 0,
    "negociosVtaG" INTEGER NOT NULL DEFAULT 0,
    "negociosTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTipoGarrafonColor" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafonBon" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafonEpura" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafonCiel" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafonElectro" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafon10Lts" INTEGER NOT NULL DEFAULT 0,
    "totalTipoGarrafonVtaG" INTEGER NOT NULL DEFAULT 0,
    "totalGarrafones" INTEGER NOT NULL DEFAULT 0,
    "totalImporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesRecord_date_key" ON "DailySalesRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Ingreso_dailySalesRecordId_key" ON "Ingreso"("dailySalesRecordId");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_dailySalesRecordId_fkey" FOREIGN KEY ("dailySalesRecordId") REFERENCES "DailySalesRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
