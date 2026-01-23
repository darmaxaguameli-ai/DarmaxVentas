-- CreateTable
CREATE TABLE "SolicitudProducto" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingInfo" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "mode" TEXT NOT NULL,
    "providerLabel" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudProducto_folio_key" ON "SolicitudProducto"("folio");
