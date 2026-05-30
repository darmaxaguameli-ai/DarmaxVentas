const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- EMPLEADOS ---
router.get('/empleados', verifyToken, async (req, res) => {
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

router.get('/empleados/:id', verifyToken, async (req, res) => {
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

module.exports = router;
