const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');

// --- EMPLEADOS ---
router.get('/empleados', verifyToken, requirePermission('canAccessRH'), async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      include: { user: { include: { roles: true } }, documentos: true, manager: true },
      orderBy: { nombreCompleto: 'asc' }
    });
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching empleados' });
  }
});

router.get('/empleados/:id', verifyToken, requirePermission('canAccessRH'), async (req, res) => {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { roles: true } }, documentos: true, manager: true, subordinados: true, historialSueldos: { orderBy: { fechaInicio: 'desc' } } },
    });
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching empleado' });
  }
});

// POST nuevo empleado
router.post('/empleados', verifyToken, requirePermission('canAccessRH'), async (req, res) => {
  try {
    const data = req.body;
    const newEmpleado = await prisma.empleado.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        puesto: data.puesto,
        sueldo: parseFloat(data.sueldo),
        telefono: data.telefono || null,
        emailPersonal: data.emailPersonal || null,
        street: data.street || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        fechaContratacion: new Date(data.fechaContratacion),
        estatus: data.estatus || 'ACTIVO',
        userId: data.userId || null,
        managerId: data.managerId || null
      },
      include: { user: true }
    });
    res.status(201).json(newEmpleado);
  } catch (error) {
    console.error("Error creating empleado:", error);
    res.status(500).json({ error: 'Error al crear empleado', message: error.message });
  }
});

// PUT actualizar empleado
router.put('/empleados/:id', verifyToken, requirePermission('canAccessRH'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // 1. Actualizar datos del expediente (Empleado)
    const updatedEmpleado = await prisma.empleado.update({
      where: { id },
      data: {
        nombreCompleto: data.nombreCompleto || undefined,
        puesto: data.puesto || undefined,
        sueldo: data.sueldo ? parseFloat(data.sueldo) : undefined,
        telefono: data.telefono !== undefined ? data.telefono : undefined,
        emailPersonal: data.emailPersonal !== undefined ? data.emailPersonal : undefined,
        street: data.street !== undefined ? data.street : undefined,
        neighborhood: data.neighborhood !== undefined ? data.neighborhood : undefined,
        city: data.city !== undefined ? data.city : undefined,
        postalCode: data.postalCode !== undefined ? data.postalCode : undefined,
        fechaContratacion: data.fechaContratacion ? new Date(data.fechaContratacion) : undefined,
        estatus: data.estatus || undefined,
        managerId: data.managerId !== undefined ? (data.managerId === "" ? null : data.managerId) : undefined,
        userId: data.userId !== undefined ? (data.userId === "" ? null : data.userId) : undefined,
      },
      include: { user: true }
    });

    // 2. Si el empleado tiene un usuario vinculado, actualizar sucursal y roles si vienen en el body
    if (updatedEmpleado.userId) {
        const userUpdateData = {};
        
        // La sucursal (storeId) vive en el modelo User
        if (data.storeId !== undefined) {
            userUpdateData.storeId = data.storeId === "" ? null : data.storeId;
        }

        // Roles (RBAC v2) viven en el modelo User
        if (data.roleIds && Array.isArray(data.roleIds)) {
            userUpdateData.roles = { set: data.roleIds.map(rid => ({ id: rid })) };
        }

        // Sexo vive en User
        if (data.sexo) {
            userUpdateData.sexo = data.sexo;
        }

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: updatedEmpleado.userId },
                data: userUpdateData
            });
        }
    }

    res.json(updatedEmpleado);
  } catch (error) {
    console.error("Error updating empleado:", error);
    res.status(500).json({ error: 'Error al actualizar empleado', message: error.message });
  }
});

// DELETE empleado (Baja)
router.delete('/empleados/:id', verifyToken, requirePermission('canAccessRH'), async (req, res) => {
  try {
    await prisma.empleado.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

module.exports = router;
