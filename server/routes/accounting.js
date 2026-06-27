const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// --- MULTER CONFIG ---
const storageDocumentos = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../storage/documentos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'doc-' + uniqueSuffix + ext);
    }
});

const uploadDocumento = multer({
    storage: storageDocumentos,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// --- DOCUMENTOS SOPORTE (MATERIALIDAD) ---
router.post('/documentos', verifyToken, uploadDocumento.single('archivo'), async (req, res) => {
  const { empresaId, tipo, nombre, tags } = req.body;
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    if (!empresaId) return res.status(400).json({ error: 'empresaId es requerido' });

    const count = await prisma.contableDocumentoSoporte.count();
    const folio = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const documento = await prisma.contableDocumentoSoporte.create({
      data: {
        folio,
        tipo: tipo || 'EVIDENCIA',
        nombre: nombre || req.file.originalname,
        ruta: `/documentos/${req.file.filename}`, // Assuming you serve this statically
        extension: path.extname(req.file.originalname).substring(1),
        tamano: req.file.size,
        tags: tags ? JSON.parse(tags) : [],
        empresaId
      }
    });

    res.status(201).json(documento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el documento' });
  }
});

router.get('/documentos', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const documentos = await prisma.contableDocumentoSoporte.findMany({
      where: empresaId ? { empresaId } : {},
      orderBy: { fecha: 'desc' }
    });
    res.json(documentos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documentos' });
  }
});

// --- EMPRESAS ---
router.get('/empresas', verifyToken, async (req, res) => {
  try {
    const empresas = await prisma.contableEmpresa.findMany({
      include: { 
        _count: { select: { cuentas: true, sucursales: true } },
        sucursales: {
          include: {
            store: true
          }
        }
      }
    });
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching empresas' });
  }
});

router.post('/empresas', verifyToken, async (req, res) => {
  try {
    const nueva = await prisma.contableEmpresa.create({ data: req.body });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating empresa' });
  }
});

router.put('/empresas/:id', verifyToken, async (req, res) => {
  try {
    const actualizada = await prisma.contableEmpresa.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error updating empresa' });
  }
});

// --- SUCURSALES CONTABLES ---
router.get('/sucursales', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const sucs = await prisma.contableSucursal.findMany({
      where: empresaId ? { empresaId } : {},
      include: { store: true }
    });
    res.json(sucs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sucursales' });
  }
});

router.post('/sucursales', verifyToken, async (req, res) => {
  try {
    const nueva = await prisma.contableSucursal.create({ data: req.body });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating sucursal' });
  }
});

router.delete('/sucursales/:id', verifyToken, async (req, res) => {
  try {
    await prisma.contableSucursal.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Sucursal contable eliminada' });
  } catch (error) {
    console.error('Error deleting sucursal contable:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal contable' });
  }
});

// --- CUENTAS CONTABLES ---
router.get('/cuentas', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  if (!empresaId) return res.status(400).json({ error: 'empresaId required' });
  try {
    const cuentas = await prisma.contableCuenta.findMany({
      where: { empresaId },
      include: { cuentaPadre: true },
      orderBy: { codigo: 'asc' }
    });
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cuentas' });
  }
});

router.post('/cuentas', verifyToken, async (req, res) => {
  try {
    const nueva = await prisma.contableCuenta.create({ data: req.body });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating cuenta' });
  }
});

router.put('/cuentas/:id', verifyToken, async (req, res) => {
  try {
    const actualizada = await prisma.contableCuenta.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error updating cuenta' });
  }
});

router.delete('/cuentas/:id', verifyToken, async (req, res) => {
  try {
    await prisma.contableCuenta.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting cuenta' });
  }
});

// --- CUENTAS BANCARIAS ---
router.get('/bancos', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const bancos = await prisma.contableCuentaBancaria.findMany({
      where: empresaId ? { empresaId } : {},
      include: { _count: { select: { movimientos: true } } }
    });
    res.json(bancos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bancos' });
  }
});

router.post('/bancos', verifyToken, async (req, res) => {
  try {
    const nueva = await prisma.contableCuentaBancaria.create({ data: req.body });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating banco' });
  }
});

// --- MOVIMIENTOS BANCARIOS ---
router.get('/movimientos', verifyToken, async (req, res) => {
  const { cuentaBancariaId } = req.query;
  try {
    const movs = await prisma.contableMovimientoBancario.findMany({
      where: cuentaBancariaId ? { cuentaBancariaId } : {},
      orderBy: { fecha: 'desc' }
    });
    res.json(movs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movimientos' });
  }
});

router.post('/movimientos', verifyToken, async (req, res) => {
  try {
    const nuevo = await prisma.contableMovimientoBancario.create({ data: req.body });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error creating movimiento' });
  }
});

// --- PÓLIZAS ---
router.get('/polizas', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const polizas = await prisma.contablePoliza.findMany({
      where: empresaId ? { empresaId } : {},
      include: { detalles: { include: { cuenta: true } } },
      orderBy: { fecha: 'desc' }
    });
    res.json(polizas);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching polizas' });
  }
});

router.post('/polizas', verifyToken, async (req, res) => {
  const { detalles, ...polizaData } = req.body;
  try {
    const nueva = await prisma.contablePoliza.create({
      data: {
        ...polizaData,
        detalles: {
          create: detalles // Arreglo de { debe, haber, cuentaId, centroCostoId }
        }
      },
      include: { detalles: true }
    });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating poliza' });
  }
});

// --- CENTROS DE COSTO ---
router.get('/centros-costo', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const centros = await prisma.contableCentroCosto.findMany({
      where: empresaId ? { empresaId } : {},
      orderBy: { clave: 'asc' }
    });
    res.json(centros);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching centros' });
  }
});

router.post('/centros-costo', verifyToken, async (req, res) => {
  try {
    const nuevo = await prisma.contableCentroCosto.create({ data: req.body });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error creating centro' });
  }
});

// --- TERCEROS (CLIENTES Y PROVEEDORES) ---
router.get('/terceros', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  if (!empresaId) return res.status(400).json({ error: 'empresaId required' });
  try {
    const clientes = await prisma.contableCliente.findMany({
      orderBy: { nombre: 'asc' }
    });
    const proveedores = await prisma.contableProveedor.findMany({
      where: { empresaId },
      orderBy: { razonSocial: 'asc' }
    });
    res.json({ clientes, proveedores });
  } catch (error) {
    console.error('Error fetching terceros:', error);
    res.status(500).json({ error: 'Error al cargar terceros' });
  }
});

router.post('/terceros', verifyToken, async (req, res) => {
  const { tipo, nombre, rfc, empresaId } = req.body;
  try {
    if (tipo === 'CLIENTE') {
      const nuevo = await prisma.contableCliente.create({
        data: { nombre, rfc }
      });
      return res.status(201).json(nuevo);
    } else if (tipo === 'PROVEEDOR') {
      const nuevo = await prisma.contableProveedor.create({
        data: { razonSocial: nombre, rfc: rfc || 'XAXX010101000', empresaId }
      });
      return res.status(201).json(nuevo);
    }
    res.status(400).json({ error: 'Tipo inválido' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating tercero' });
  }
});

// --- CONTRATOS (BIENES RAÍCES / VENDING POINT) ---
router.get('/contratos', verifyToken, async (req, res) => {
  const { empresaId, centroCostoId } = req.query;
  try {
    const contratos = await prisma.contableContrato.findMany({
      where: { 
        empresaId,
        centroCostoId: centroCostoId || undefined
      },
      include: { centroCosto: true },
      orderBy: { diaPago: 'asc' }
    });
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contratos' });
  }
});

router.post('/contratos', verifyToken, async (req, res) => {
  try {
    const count = await prisma.contableContrato.count();
    const folio = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const nuevo = await prisma.contableContrato.create({
      data: { ...req.body, folio }
    });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error creating contrato' });
  }
});

// --- REPORTE RENTABILIDAD POR UNIDAD ---
router.get('/rentabilidad', verifyToken, async (req, res) => {
  const { empresaId, mes, anio } = req.query;
  try {
    const centros = await prisma.contableCentroCosto.findMany({
      where: { empresaId },
      include: {
        polizaDetalles: {
          where: {
            poliza: {
              fecha: {
                gte: new Date(anio, mes - 1, 1),
                lt: new Date(anio, mes, 1)
              }
            }
          }
        }
      }
    });

    const reporte = centros.map(c => {
      let ingresos = 0;
      let egresos = 0;
      c.polizaDetalles.forEach(d => {
        ingresos += d.haber; // En cuentas de ingreso, abono es positivo
        egresos += d.debe;   // En cuentas de egreso, cargo es positivo
      });
      return {
        unidad: c.nombre,
        clave: c.clave,
        ingresos,
        egresos,
        utilidad: ingresos - egresos
      };
    });

    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
});

// --- REPORTES PROFESIONALES ---
// 1. Balanza de Comprobación
router.get('/balanza', verifyToken, async (req, res) => {
  const { empresaId, mes, anio } = req.query;
  try {
    const cuentas = await prisma.contableCuenta.findMany({
      where: { empresaId },
      include: {
        polizaDetalles: {
          include: { poliza: true }
        }
      },
      orderBy: { codigo: 'asc' }
    });

    const balanza = cuentas.map(c => {
      let cargos = 0;
      let abonos = 0;
      
      c.polizaDetalles.forEach(d => {
        // Podríamos filtrar por mes y año aquí si se pasan
        cargos += d.debe;
        abonos += d.haber;
      });
      
      let saldoFinal = (c.naturaleza === 'DEUDORA' ? cargos - abonos : abonos - cargos);

      return {
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        naturaleza: c.naturaleza,
        saldoInicial: 0, // Placeholder
        cargos,
        abonos,
        saldoFinal
      };
    });

    res.json(balanza);
  } catch (error) {
    res.status(500).json({ error: 'Error generando balanza' });
  }
});

// 2. Libro Mayor
router.get('/libro-mayor', verifyToken, async (req, res) => {
  const { empresaId, cuentaId } = req.query;
  try {
    const detalles = await prisma.contablePolizaDetalle.findMany({
      where: {
        cuenta: { empresaId: empresaId },
        cuentaId: cuentaId || undefined
      },
      include: {
        poliza: true,
        cuenta: true
      },
      orderBy: { poliza: { fecha: 'asc' } }
    });
    res.json(detalles);
  } catch (error) {
    res.status(500).json({ error: 'Error generando libro mayor' });
  }
});

// 3. Estado de Resultados (P&L)
router.get('/estado-resultados', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const cuentas = await prisma.contableCuenta.findMany({
      where: { 
        empresaId,
        tipo: { in: ['INGRESO', 'EGRESO'] }
      },
      include: {
        polizaDetalles: true
      }
    });

    let totalIngresos = 0;
    let totalEgresos = 0;

    cuentas.forEach(c => {
      let saldo = 0;
      c.polizaDetalles.forEach(d => {
        if (c.tipo === 'INGRESO') saldo += d.haber - d.debe;
        if (c.tipo === 'EGRESO') saldo += d.debe - d.haber;
      });

      if (c.tipo === 'INGRESO') totalIngresos += saldo;
      if (c.tipo === 'EGRESO') totalEgresos += saldo;
    });

    res.json({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      utilidad: totalIngresos - totalEgresos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando estado de resultados' });
  }
});


// --- EJERCICIOS Y PERIODOS ---
router.get('/ejercicios', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  if (!empresaId) return res.status(400).json({ error: 'empresaId required' });
  try {
    const ejercicios = await prisma.contableEjercicio.findMany({
      where: { empresaId },
      include: { periodos: { orderBy: { mes: 'asc' } } },
      orderBy: { anio: 'desc' }
    });
    res.json(ejercicios);
  } catch (error) {
    console.error('Error fetching ejercicios:', error);
    res.status(500).json({ error: 'Error al cargar ejercicios fiscales' });
  }
});

router.post('/ejercicios', verifyToken, async (req, res) => {
  const { empresaId, anio } = req.body;
  if (!empresaId || !anio) return res.status(400).json({ error: 'empresaId and anio required' });
  
  try {
    const existe = await prisma.contableEjercicio.findUnique({
      where: {
        anio_empresaId: {
          anio: parseInt(anio),
          empresaId
        }
      }
    });

    if (existe) {
      return res.status(400).json({ error: `El ejercicio fiscal ${anio} ya está aperturado para esta empresa.` });
    }

    const nuevoEjercicio = await prisma.$transaction(async (tx) => {
      const ejercicio = await tx.contableEjercicio.create({
        data: {
          anio: parseInt(anio),
          empresaId,
          abierto: true
        }
      });

      const periodosData = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        abierto: true,
        ejercicioId: ejercicio.id
      }));

      await tx.contablePeriodo.createMany({
        data: periodosData
      });

      return tx.contableEjercicio.findUnique({
        where: { id: ejercicio.id },
        include: { periodos: { orderBy: { mes: 'asc' } } }
      });
    });

    res.status(201).json(nuevoEjercicio);
  } catch (error) {
    console.error('Error creating ejercicio:', error);
    res.status(500).json({ error: 'Error al aperturar ejercicio fiscal' });
  }
});

router.put('/periodos/:id/toggle', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const periodo = await prisma.contablePeriodo.findUnique({ where: { id } });
    if (!periodo) return res.status(404).json({ error: 'Periodo no encontrado' });

    const actualizado = await prisma.contablePeriodo.update({
      where: { id },
      data: {
        abierto: !periodo.abierto,
        fechaCierre: !periodo.abierto ? new Date() : null,
        usuarioCierre: !periodo.abierto ? req.user?.name || 'Sistema' : null
      }
    });
    res.json(actualizado);
  } catch (error) {
    console.error('Error toggling periodo:', error);
    res.status(500).json({ error: 'Error al actualizar periodo fiscal' });
  }
});

module.exports = router;
