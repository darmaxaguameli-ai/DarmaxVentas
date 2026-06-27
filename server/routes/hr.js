const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// ==========================================
// EMPLEADOS CRUD
// ==========================================
router.get('/hr/empleados', verifyToken, async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({ 
        orderBy: { nombreCompleto: 'asc' },
        include: {
            user: {
                include: {
                    roles: true
                }
            }
        }
    });
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching empleados' });
  }
});

router.get('/hr/empleados/:id', verifyToken, async (req, res) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          include: {
            roles: true,
            store: true
          }
        },
        manager: true,
        subordinados: true,
        documentos: true,
        historialSueldos: {
          orderBy: { fechaInicio: 'desc' }
        }
      }
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json(empleado);
  } catch (error) {
    console.error('Error fetching empleado by id:', error);
    res.status(500).json({ error: 'Error fetching empleado details' });
  }
});

router.post('/hr/empleados', verifyToken, async (req, res) => {
  try {
    const { 
      id, createdAt, updatedAt, user, manager, subordinados, documentos, 
      historialSueldos, nominaDetalles, contableDocumentoSoportes,
      sexo, password, roleIds, storeId, ...data 
    } = req.body;

    // Si la fechaContratacion viene, asegúrate de que sea objeto Date
    if (data.fechaContratacion) {
        data.fechaContratacion = new Date(data.fechaContratacion);
    }
    const nuevo = await prisma.empleado.create({ data });

    if (nuevo.userId && sexo !== undefined) {
      await prisma.user.update({
        where: { id: nuevo.userId },
        data: { sexo: sexo === '' ? null : sexo }
      });
    }

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error creating empleado:', error);
    res.status(500).json({ error: error.message || 'Error creating empleado' });
  }
});

router.put('/hr/empleados/:id', verifyToken, async (req, res) => {
  try {
    const { 
      id, createdAt, updatedAt, user, manager, subordinados, documentos, 
      historialSueldos, nominaDetalles, contableDocumentoSoportes,
      sexo, password, roleIds, storeId, ...validData 
    } = req.body;

    if (validData.fechaContratacion) validData.fechaContratacion = new Date(validData.fechaContratacion);
    if (validData.fechaTerminacion) validData.fechaTerminacion = new Date(validData.fechaTerminacion);

    const actualizado = await prisma.empleado.update({
      where: { id: req.params.id },
      data: validData
    });

    // Si viene sexo, actualizar el campo correspondiente en el modelo User asociado
    const emp = await prisma.empleado.findUnique({
      where: { id: req.params.id },
      select: { userId: true }
    });

    if (emp && emp.userId && sexo !== undefined) {
      await prisma.user.update({
        where: { id: emp.userId },
        data: { sexo: sexo === '' ? null : sexo }
      });
    }

    res.json(actualizado);
  } catch (error) {
    console.error('Error updating empleado:', error);
    res.status(500).json({ error: error.message || 'Error updating empleado' });
  }
});

router.delete('/hr/empleados/:id', verifyToken, async (req, res) => {
  try {
    await prisma.empleado.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting empleado' });
  }
});

// ==========================================
// NÓMINAS
// ==========================================
router.get('/hr', verifyToken, async (req, res) => {
  const { empresaId } = req.query;
  try {
    const nominas = await prisma.nomina.findMany({
      where: empresaId ? { empresaId } : {},
      include: { _count: { select: { detalles: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(nominas);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching nominas' });
  }
});

// --- GENERAR NÓMINA DEL MES ---
router.post('/hr/generar', verifyToken, async (req, res) => {
  const { empresaId, mes, anio } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener empleados activos
      const empleados = await tx.empleado.findMany({
        where: { estatus: 'ACTIVO' }
      });

      if (empleados.length === 0) throw new Error('No hay empleados activos');

      // 2. Crear cabecera
      const count = await tx.nomina.count();
      const folio = `NOM-${anio}-${String(mes).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;
      
      let totalNomina = 0;

      const nuevaNomina = await tx.nomina.create({
        data: {
          folio,
          mes,
          anio,
          empresaId,
          total: 0 // Se actualiza al final
        }
      });

      // 3. Crear detalles
      for (const emp of empleados) {
        const totalNeto = emp.sueldo; // Lógica base
        totalNomina += totalNeto;

        await tx.nominaDetalle.create({
          data: {
            nominaId: nuevaNomina.id,
            empleadoId: emp.id,
            sueldoBase: emp.sueldo,
            totalNeto
          }
        });
      }

      // 4. Actualizar total
      return await tx.nomina.update({
        where: { id: nuevaNomina.id },
        data: { total: totalNomina }
      });
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PAGAR NÓMINA (GENERA PÓLIZA) ---
router.post('/hr/:id/pagar', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { cuentaBancariaId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const nomina = await tx.nomina.findUnique({
        where: { id },
        include: { empresa: true }
      });

      if (!nomina || nomina.estatus === 'PAGADA') throw new Error('Nómina no válida');

      // 1. Crear Póliza de Egreso
      const countP = await tx.contablePoliza.count({ where: { empresaId: nomina.empresaId, tipo: 'EGRESOS' } });
      const pFolio = `EGR-NOM-${new Date().getFullYear()}-${String(countP + 1).padStart(4, '0')}`;

      const poliza = await tx.contablePoliza.create({
        data: {
          folio: pFolio,
          tipo: 'EGRESOS',
          concepto: `PAGO DE NÓMINA MES ${nomina.mes}/${nomina.anio} FOLIO: ${nomina.folio}`,
          fecha: new Date(),
          empresaId: nomina.empresaId,
          estatus: 'POSTEADA',
          detalles: {
            create: [
              { cuentaId: nomina.empresa.cuentaBancosId || 'CTA-BANCO-DEFAULT', haber: nomina.total },
              { cuentaId: 'CTA-GASTO-NOMINA', debe: nomina.total } // Gasto simulado si no hay cuenta mapeada
            ]
          }
        }
      });

      // 2. Crear Movimiento Bancario
      await tx.contableMovimientoBancario.create({
        data: {
          fecha: new Date(),
          tipo: 'EGRESO',
          importe: nomina.total,
          referencia: nomina.folio,
          cuentaBancariaId
        }
      });

      // 3. Actualizar Nómina
      return await tx.nomina.update({
        where: { id },
        data: { estatus: 'PAGADA', polizaId: poliza.id }
      });
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CERRAR PERIODO MENSUAL ---
router.post('/hr/periodos/:id/cerrar', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const periodo = await prisma.contablePeriodo.update({
      where: { id },
      data: {
        abierto: false,
        fechaCierre: new Date(),
        usuarioCierre: req.user.name
      }
    });
    res.json(periodo);
  } catch (error) {
    res.status(500).json({ error: 'Error cerrando periodo' });
  }
});

module.exports = router;
