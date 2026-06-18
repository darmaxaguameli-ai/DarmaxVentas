const prisma = require('../lib/prisma');

/**
 * Genera una póliza automática basada en un evento del sistema.
 * @param {Object} options 
 * @param {string} options.empresaId - ID de la empresa contable
 * @param {string} options.tipo - INGRESOS, EGRESOS, DIARIO
 * @param {string} options.concepto - Descripción de la póliza
 * @param {number} options.monto - Importe total
 * @param {string} options.centroCostoClave - Clave del centro de costo (opcional)
 * @param {Object[]} options.asientos - Arreglo de { cuentaId, debe, haber }
 */
async function generarPolizaAutomatica({ empresaId, tipo, concepto, asientos }) {
    try {
        const empresa = await prisma.contableEmpresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa || !empresa.contabilidadAutomatica) {
            console.log(`[Accounting] Automatización desactivada para empresa ${empresaId}`);
            return null;
        }

        // Generar folio automático (ej: ING-2024-0001)
        const count = await prisma.contablePoliza.count({
            where: { empresaId, tipo }
        });
        const prefix = tipo.substring(0, 3).toUpperCase();
        const anio = new Date().getFullYear();
        const folio = `${prefix}-${anio}-${String(count + 1).padStart(5, '0')}`;

        const poliza = await prisma.contablePoliza.create({
            data: {
                folio,
                tipo,
                concepto,
                fecha: new Date(),
                empresaId,
                estatus: 'POSTEADA', // Se asume posteada si es automática
                detalles: {
                    create: asientos.map(a => ({
                        cuentaId: a.cuentaId,
                        debe: a.debe || 0,
                        haber: a.haber || 0
                    }))
                }
            }
        });

        console.log(`[Accounting] Póliza automática generada: ${folio}`);
        return poliza;
    } catch (error) {
        console.error('[Accounting] Error generando póliza automática:', error);
        throw error;
    }
}

/**
 * Wrapper para ventas de POS
 */
async function contabilizarVentaPOS(pedido, empresaId) {
    const empresa = await prisma.contableEmpresa.findUnique({ where: { id: empresaId } });
    if (!empresa || !empresa.contabilidadAutomatica || !empresa.cuentaVentasId || !empresa.cuentaBancosId) return;

    return generarPolizaAutomatica({
        empresaId,
        tipo: 'INGRESOS',
        concepto: `VENTA POS FOLIO: ${pedido.customId}`,
        asientos: [
            { cuentaId: empresa.cuentaBancosId, debe: pedido.total }, // Cargo a Bancos/Caja
            { cuentaId: empresa.cuentaVentasId, haber: pedido.total }  // Abono a Ventas
        ]
    });
}

/**
 * Wrapper para cortes de Vending
 */
async function contabilizarCorteVending(corte, empresaId) {
    const empresa = await prisma.contableEmpresa.findUnique({ where: { id: empresaId } });
    if (!empresa || !empresa.contabilidadAutomatica || !empresa.cuentaVendingId || !empresa.cuentaBancosId) return;

    return generarPolizaAutomatica({
        empresaId,
        tipo: 'INGRESOS',
        concepto: `RECAUDACIÓN VENDING FOLIO: ${corte.folio}`,
        asientos: [
            { cuentaId: empresa.cuentaBancosId, debe: corte.efectivoReclectado }, // Cargo a Bancos/Caja
            { cuentaId: empresa.cuentaVendingId, haber: corte.efectivoReclectado } // Abono a Vending
        ]
    });
}

/**
 * Busca la empresa contable vinculada a una sucursal operativa
 */
async function findEmpresaByStore(storeId) {
    const sucursal = await prisma.contableSucursal.findFirst({
        where: { storeId },
        select: { empresaId: true }
    });
    return sucursal?.empresaId || null;
}

/**
 * Procesa los contratos recurrentes (Rentas) y genera Cuentas por Cobrar (CxC)
 * Esta función debería ser llamada diariamente por un CRON job (ej: node-cron)
 */
async function procesarRentasMensuales() {
    console.log('[Accounting] Iniciando procesamiento de rentas automáticas...');
    const hoy = new Date();
    const diaActual = hoy.getDate();

    try {
        // Buscar contratos vigentes cuyo día de pago sea hoy (o en el pasado y no cobrados, simplificado a hoy para el demo)
        const contratos = await prisma.contableContrato.findMany({
            where: {
                estatus: 'VIGENTE',
                diaPago: diaActual
            },
            include: { empresa: true, centroCosto: true }
        });

        if (contratos.length === 0) {
            console.log('[Accounting] No hay rentas programadas para hoy.');
            return { message: 'No hay rentas programadas para hoy', count: 0 };
        }

        let procesados = 0;

        for (const contrato of contratos) {
            // 1. Asegurar que el tercero (Inquilino) exista como Cliente para la CxC
            let cliente = await prisma.contableCliente.findFirst({
                where: { nombre: contrato.terceroNombre }
            });

            if (!cliente) {
                cliente = await prisma.contableCliente.create({
                    data: {
                        nombre: contrato.terceroNombre,
                        rfc: contrato.terceroRfc || 'XAXX010101000'
                    }
                });
            }

            // 2. Crear la Cuenta por Cobrar (CxC) vinculada al contrato
            await prisma.contableCxC.create({
                data: {
                    total: contrato.monto,
                    saldo: contrato.monto,
                    vencimiento: new Date(hoy.setDate(hoy.getDate() + 5)), // 5 días de tolerancia
                    clienteId: cliente.id,
                    contratoId: contrato.id
                }
            });

            // Nota: La póliza de ingreso se generará cuando el cliente pague la CxC.
            procesados++;
        }

        console.log(`[Accounting] Se generaron ${procesados} cargos por renta exitosamente.`);
        return { message: 'Rentas procesadas correctamente', count: procesados };
    } catch (error) {
        console.error('[Accounting] Error procesando rentas automáticas:', error);
        throw error;
    }
}

module.exports = {
    generarPolizaAutomatica,
    contabilizarVentaPOS,
    contabilizarCorteVending,
    findEmpresaByStore,
    procesarRentasMensuales
};
