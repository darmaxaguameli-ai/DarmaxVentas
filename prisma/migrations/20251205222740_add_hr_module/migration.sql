-- CreateEnum
CREATE TYPE "EstatusEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoTerminacion" AS ENUM ('RENUNCIA', 'DESPIDO', 'LIQUIDACION');

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "sueldo" DOUBLE PRECISION NOT NULL,
    "telefono" TEXT,
    "emailPersonal" TEXT,
    "street" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "fechaContratacion" TIMESTAMP(3) NOT NULL,
    "fechaTerminacion" TIMESTAMP(3),
    "tipoTerminacion" "TipoTerminacion",
    "estatus" "EstatusEmpleado" NOT NULL DEFAULT 'ACTIVO',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empleadoId" TEXT NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_emailPersonal_key" ON "Empleado"("emailPersonal");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_userId_key" ON "Empleado"("userId");

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
