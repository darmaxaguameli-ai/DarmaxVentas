/*
  Warnings:

  - Changed the type of `tipo` on the `Documento` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('INE', 'CONTRATO', 'COMPROBANTE_DOMICILIO', 'OTRO');

-- AlterTable
ALTER TABLE "Documento" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoDocumento" NOT NULL;

-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "managerId" TEXT;

-- CreateTable
CREATE TABLE "HistorialSueldo" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "sueldo" DOUBLE PRECISION NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialSueldo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialSueldo" ADD CONSTRAINT "HistorialSueldo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
