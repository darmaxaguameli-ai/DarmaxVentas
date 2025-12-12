/*
  Warnings:

  - You are about to drop the `Transaccion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoSesionCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoTransaccionCaja" AS ENUM ('INGRESO', 'RETIRO', 'VENTA');

-- DropForeignKey
ALTER TABLE "Transaccion" DROP CONSTRAINT "Transaccion_sesionId_fkey";

-- AlterTable
ALTER TABLE "SesionCaja" ADD COLUMN     "estado" "EstadoSesionCaja" NOT NULL DEFAULT 'ABIERTA';

-- DropTable
DROP TABLE "Transaccion";

-- CreateTable
CREATE TABLE "TransaccionCaja" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransaccionCaja" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sesionId" TEXT NOT NULL,
    "pedidoId" TEXT,

    CONSTRAINT "TransaccionCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransaccionCaja_pedidoId_key" ON "TransaccionCaja"("pedidoId");

-- AddForeignKey
ALTER TABLE "TransaccionCaja" ADD CONSTRAINT "TransaccionCaja_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionCaja" ADD CONSTRAINT "TransaccionCaja_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
