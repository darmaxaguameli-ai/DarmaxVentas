const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- INCOMES ---
router.get('/incomes', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) where.storeId = user.storeId;
        else return res.json([]);
    }
    const incomes = await prisma.ingreso.findMany({ where, include: { store: true }, orderBy: { date: 'desc' } });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching incomes' });
  }
});

// --- EXPENSES ---
router.get('/expenses', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) where.storeId = user.storeId;
        else return res.json([]);
    }
    const expenses = await prisma.gasto.findMany({ where, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

// --- CASH DRAWER ---
router.get('/cash-drawer/active', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
    const where = { vendedorId: userId, estado: 'ABIERTA' };
    if (user && user.storeId) where.storeId = user.storeId;
    const activeSession = await prisma.sesionCaja.findFirst({
      where,
      include: { transacciones: { orderBy: { createdAt: 'asc' } }, pedidos: { include: { items: true } } },
    });
    res.json(activeSession);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching active session' });
  }
});

module.exports = router;
