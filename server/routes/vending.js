const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { contabilizarCorteVending, findEmpresaByStore } = require('../utils/accountingAutomations');

// ==========================================
// MÁQUINAS VENDING
// ==========================================
router.get('/machines', verifyToken, async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = storeId ? { storeId } : {};
    
    const machines = await prisma.vendingMachine.findMany({
      where,
      include: { store: true },
      orderBy: { name: 'asc' }
    });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vending machines' });
  }
});

router.post('/machines', verifyToken, async (req, res) => {
  try {
    const nueva = await prisma.vendingMachine.create({ data: req.body });
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vending machine' });
  }
});

router.put('/machines/:id', verifyToken, async (req, res) => {
  try {
    const actualizada = await prisma.vendingMachine.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error updating vending machine' });
  }
});

router.delete('/machines/:id', verifyToken, async (req, res) => {
  try {
    await prisma.vendingMachine.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting vending machine' });
  }
});

// ==========================================
// CORTES VENDING
// ==========================================
router.post('/cortes', verifyToken, async (req, res) => {
  try {
    const data = req.body;
    // Generar folio si no viene
    if (!data.folio) {
      const count = await prisma.vendingCorte.count();
      data.folio = `CRT-${String(count + 1).padStart(5, '0')}`;
    }
    const nuevo = await prisma.vendingCorte.create({ 
      data: {
        ...data,
        usuarioId: req.user.id // El usuario que realiza el corte
      },
      include: { vendingMachine: true }
    });

    // --- AL FINAL DEL CORTE POST (AUTOMATIZACIÓN CONTABLE) ---
    try {
        const empresaId = await findEmpresaByStore(nuevo.vendingMachine.storeId);
        if (empresaId) {
            await contabilizarCorteVending(nuevo, empresaId);
        }
    } catch (e) {
        console.error('[Accounting] Error en contabilización automática Vending:', e);
    }

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error creating corte' });
  }
});

module.exports = router;
