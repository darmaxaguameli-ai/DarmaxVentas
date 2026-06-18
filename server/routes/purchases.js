const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- SOLICITUDES DE COMPRA ---
router.get('/solicitudes', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const solicitudes = await prisma.solicitudCompra.findMany({
      where: empresaId ? { empresaId } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching solicitudes' });
  }
});

router.post('/solicitudes', verifyToken, async (req, res) => {
  try {
    const count = await prisma.solicitudCompra.count();
    const folio = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const nueva = await prisma.solicitudCompra.create({
      data: { ...req.body, folio }
    });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating solicitud' });
  }
});

// --- ÓRDENES DE COMPRA ---
router.get('/ordenes', verifyToken, async (req, res) => {
  const { empresaId, status } = req.query;
  try {
    const where = { proveedor: { empresaId: empresaId } };
    if (status) where.status = status;

    const ordenes = await prisma.ordenCompra.findMany({
      where,
      include: { proveedor: true, solicitud: true, store: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching ordenes' });
  }
});

router.post('/ordenes', verifyToken, async (req, res) => {
  try {
    const count = await prisma.ordenCompra.count();
    const folio = `OC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const nueva = await prisma.ordenCompra.create({
      data: { ...req.body, folio }
    });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating orden' });
  }
});

// --- RECEPCIONES (LA LÓGICA CORE) ---
router.post('/recepciones', verifyToken, async (req, res) => {
  const { ordenId, items, recibidoPor, notas } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la orden para saber a qué tienda pertenece
      const orden = await tx.ordenCompra.findUnique({
        where: { id: ordenId },
        include: { proveedor: true }
      });

      if (!orden) throw new Error('Orden no encontrada');
      if (!orden.storeId) throw new Error('La orden no tiene una sucursal destino asignada');

      // 2. Crear el registro de recepción
      const count = await tx.recepcionCompra.count();
      const folio = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      
      const nuevaRecepcion = await tx.recepcionCompra.create({
        data: {
          folio,
          ordenId,
          recibidoPor,
          notas,
          items // Items realmente recibidos { productId, quantity }
        }
      });

      // 3. ACTUALIZAR INVENTARIO (Suma de stock)
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          await tx.storeInventory.upsert({
            where: {
              storeId_productId: {
                storeId: orden.storeId,
                productId: item.productId
              }
            },
            update: {
              stock: { increment: parseInt(item.quantity) }
            },
            create: {
              storeId: orden.storeId,
              productId: item.productId,
              stock: parseInt(item.quantity)
            }
          });
        }
      }

      // 4. Crear Cuenta por Pagar (CxP)
      // Calculamos el total de lo recibido si el item trae precio, o usamos el de la OC
      await tx.contableCxP.create({
        data: {
          total: orden.total, // Podría ser total de lo recibido
          saldo: orden.total,
          vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días default
          proveedorId: orden.proveedorId,
          ordenCompraId: orden.id
        }
      });

      // 5. Actualizar estatus de la Orden
      await tx.ordenCompra.update({
        where: { id: ordenId },
        data: { status: 'RECIBIDA_TOTAL' } // Simplificado a total por ahora
      });

      return nuevaRecepcion;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('[Purchases] Error en recepción:', error);
    res.status(500).json({ error: error.message });
  }
});

const { generarPolizaAutomatica } = require('../utils/accountingAutomations');

// ...

// --- CUENTAS POR PAGAR (CxP) ---
router.get('/cxp', verifyToken, async (req, res) => {
  const { empresaId, status } = req.query; // status: PENDIENTE, PAGADA
  try {
    const cxp = await prisma.contableCxP.findMany({
      where: { 
        proveedor: { empresaId: empresaId },
        saldo: status === 'PENDIENTE' ? { gt: 0 } : status === 'PAGADA' ? 0 : undefined
      },
      include: { proveedor: true, ordenCompra: true },
      orderBy: { vencimiento: 'asc' }
    });
    res.json(cxp);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching CxP' });
  }
});

router.post('/cxp/:id/pagar', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { importe, cuentaBancariaId, referencia, concepto } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener CxP
      const cxp = await tx.contableCxP.findUnique({
        where: { id },
        include: { proveedor: true }
      });

      if (!cxp) throw new Error('Cuenta por pagar no encontrada');
      if (importe > cxp.saldo) throw new Error('El importe excede el saldo pendiente');

      // 2. Crear Movimiento Bancario (Salida)
      const movimiento = await tx.contableMovimientoBancario.create({
        data: {
          fecha: new Date(),
          tipo: 'EGRESO',
          importe: importe,
          referencia,
          cuentaBancariaId
        }
      });

      // 3. Actualizar Saldo CxP
      const nuevoSaldo = cxp.saldo - importe;
      await tx.contableCxP.update({
        where: { id },
        data: { saldo: nuevoSaldo }
      });

      // 4. GENERAR PÓLIZA DE EGRESO (Automatización)
      const empresa = await tx.contableEmpresa.findUnique({
        where: { id: cxp.proveedor.empresaId }
      });

      if (empresa?.contabilidadAutomatica && empresa.cuentaBancosId) {
        // Buscamos una cuenta de pasivo para el proveedor o una genérica de CxP
        // Por simplicidad usamos la cuenta default de Bancos (Abono) y 
        // necesitamos una cuenta de cargo (Gasto o Pasivo). 
        // En una implementación real, el proveedor tendría su propia cuentaId.
        
        const count = await tx.contablePoliza.count({ where: { empresaId: empresa.id, tipo: 'EGRESOS' } });
        const folio = `EGR-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        await tx.contablePoliza.create({
          data: {
            folio,
            tipo: 'EGRESOS',
            concepto: concepto || `PAGO A PROVEEDOR: ${cxp.proveedor.razonSocial}`,
            fecha: new Date(),
            empresaId: empresa.id,
            estatus: 'POSTEADA',
            detalles: {
              create: [
                { cuentaId: empresa.cuentaBancosId, haber: importe }, // Abono a Bancos
                { cuentaId: 'P-GENERICA-CXP', debe: importe } // Cargo a Pasivo (Simulado)
              ]
            }
          }
        });
      }

      return { nuevoSaldo, movimientoId: movimiento.id };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
