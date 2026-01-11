-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDEDOR', 'REPARTIDOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'EN_RUTA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAGADO', 'NO_PAGADO');

-- CreateEnum
CREATE TYPE "EstadoSesionCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoTransaccionCaja" AS ENUM ('INGRESO', 'RETIRO', 'VENTA', 'CAMBIO');

-- CreateEnum
CREATE TYPE "DeliverySpeed" AS ENUM ('ESTANDAR', 'EXPRES');

-- CreateEnum
CREATE TYPE "EstatusEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoTerminacion" AS ENUM ('RENUNCIA', 'DESPIDO', 'LIQUIDACION');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('INE', 'CONTRATO', 'COMPROBANTE_DOMICILIO', 'OTRO');        

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
    "imageUrl" TEXT,
    "compatibleCapId" TEXT,

    CONSTRAINT "JugBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "franchiseId" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreInventory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "neighborhood" TEXT,
    "municipality" TEXT,
    "state" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "references" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
    "sexo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "PedidoStatus" NOT NULL DEFAULT 'PENDIENTE',
    "deliveryMethod" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NO_PAGADO',
    "deliveryDate" TIMESTAMP(3),
    "deliveryTimeSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "sesionCajaId" TEXT,
    "deliverySpeed" "DeliverySpeed" NOT NULL DEFAULT 'ESTANDAR',
    "expressSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "deliveryLat" DOUBLE PRECISION,
    "deliveryLng" DOUBLE PRECISION,
    "repartidorId" TEXT,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productId" TEXT,
    "servicePriceId" TEXT,
    "jugBrandId" TEXT,
    "jugBrandName" TEXT,
    "jugBrandImageUrl" TEXT,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionCaja" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "openingBalance" DOUBLE PRECISION NOT NULL,
    "closingBalance" DOUBLE PRECISION,
    "expectedBalance" DOUBLE PRECISION,
    "estado" "EstadoSesionCaja" NOT NULL DEFAULT 'ABIERTA',
    "vendedorId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "SesionCaja_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pedidoId" TEXT,
    "dailySalesRecordId" TEXT,
    "storeId" TEXT,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

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
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empleadoId" TEXT NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombreCliente" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "cp" TEXT,
    "modeloNombre" TEXT,
    "modeloPrecio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fleteTinacos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viaticos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" JSONB,
    "promoTexto" TEXT,
    "promoCosto" DOUBLE PRECISION,
    "promoImagen" TEXT,
    "firma" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JugBrandToServicePrice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JugBrandToServicePrice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaterType_name_key" ON "WaterType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_name_method_waterTypeId_key" ON "ServicePrice"("name", "method", "waterTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "JugBrand_name_key" ON "JugBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_name_key" ON "Franchise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInventory_storeId_productId_key" ON "StoreInventory"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "User_customId_key" ON "User"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_customId_key" ON "Pedido"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "TransaccionCaja_pedidoId_key" ON "TransaccionCaja"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingreso_pedidoId_key" ON "Ingreso"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingreso_dailySalesRecordId_key" ON "Ingreso"("dailySalesRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesRecord_date_key" ON "DailySalesRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_emailPersonal_key" ON "Empleado"("emailPersonal");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_userId_key" ON "Empleado"("userId");

-- CreateIndex
CREATE INDEX "_JugBrandToServicePrice_B_index" ON "_JugBrandToServicePrice"("B");

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_waterTypeId_fkey" FOREIGN KEY ("waterTypeId") REFERENCES "WaterType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JugBrand" ADD CONSTRAINT "JugBrand_compatibleCapId_fkey" FOREIGN KEY ("compatibleCapId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_servicePriceId_fkey" FOREIGN KEY ("servicePriceId") REFERENCES "ServicePrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionCaja" ADD CONSTRAINT "TransaccionCaja_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionCaja" ADD CONSTRAINT "TransaccionCaja_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_dailySalesRecordId_fkey" FOREIGN KEY ("dailySalesRecordId") REFERENCES "DailySalesRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialSueldo" ADD CONSTRAINT "HistorialSueldo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_A_fkey" FOREIGN KEY ("A") REFERENCES "JugBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_B_fkey" FOREIGN KEY ("B") REFERENCES "ServicePrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
