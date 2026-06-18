const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- LISTAR LEADS ---
router.get('/', verifyToken, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { vendedor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leads' });
  }
});

// --- CREAR LEAD ---
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, vendedor, showcaseInstallation, ...data } = req.body;
    const nuevo = await prisma.lead.create({
      data: {
        ...data,
        vendedorId: req.user.id
      }
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Error creating lead' });
  }
});

// --- ACTUALIZAR LEAD ---
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, vendedor, vendedorId, showcaseInstallation, ...data } = req.body;
    const actualizado = await prisma.lead.update({
      where: { id: req.params.id },
      data
    });
    res.json(actualizado);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Error updating lead' });
  }
});

module.exports = router;
