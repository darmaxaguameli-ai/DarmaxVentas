const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');

// --- INCOMES ---
router.get('/incomes', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
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

router.post('/incomes', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    const { description, amount, date, storeId } = req.body;
    const income = await prisma.ingreso.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        storeId: storeId || null
      }
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ingreso' });
  }
});

router.put('/incomes/:id', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    const { description, amount, date, storeId } = req.body;
    const income = await prisma.ingreso.update({
      where: { id: req.params.id },
      data: {
        description: description || undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        storeId: storeId !== undefined ? storeId : undefined
      }
    });
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ingreso' });
  }
});

router.delete('/incomes/:id', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    await prisma.ingreso.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ingreso' });
  }
});

// --- EXPENSES ---
router.get('/expenses', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) where.storeId = user.storeId;
        else return res.json([]);
    }
    const expenses = await prisma.gasto.findMany({ where, include: { store: true }, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

router.post('/expenses', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    const { description, amount, date, storeId } = req.body;
    const expense = await prisma.gasto.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        storeId: storeId || null
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear gasto' });
  }
});

router.put('/expenses/:id', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    const { description, amount, date, storeId } = req.body;
    const expense = await prisma.gasto.update({
      where: { id: req.params.id },
      data: {
        description: description || undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        storeId: storeId !== undefined ? storeId : undefined
      }
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
});

router.delete('/expenses/:id', verifyToken, requirePermission('canAccessFinances'), async (req, res) => {
  try {
    await prisma.gasto.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

// --- CASH DRAWER ---
// POS access covers cash drawer operations
router.get('/cash-drawer/active', verifyToken, async (req, res) => {
  try {
    // Check if user has either POS or Delivery access to see active session
    const user = req.fullUser;
    const hasAccess = user.role === 'ADMIN' || user.roles.some(r => r.canAccessPOS || r.canAccessDelivery);
    if (!hasAccess) return res.status(403).json({ error: 'No tienes permiso para gestionar la caja.' });

    const userId = req.user.id;
    const where = { vendedorId: userId, estado: 'ABIERTA' };
    if (user.storeId) where.storeId = user.storeId;
    const activeSession = await prisma.sesionCaja.findFirst({
      where,
      include: { transacciones: { orderBy: { createdAt: 'asc' } }, pedidos: { include: { items: true } } },
    });
    res.json(activeSession);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching active session' });
  }
});

router.post('/cash-drawer/start', verifyToken, async (req, res) => {
    try {
        const user = req.fullUser;
        const hasAccess = user.role === 'ADMIN' || user.roles.some(r => r.canAccessPOS || r.canAccessDelivery);
        if (!hasAccess) return res.status(403).json({ error: 'No tienes permiso para iniciar caja.' });

        const userId = req.user.id;
        const { openingBalance, initialTags } = req.body;

        if (!user.storeId) {
            return res.status(400).json({ error: 'El usuario no tiene una sucursal asignada.' });
        }

        const activeSession = await prisma.sesionCaja.findFirst({
            where: { vendedorId: userId, estado: 'ABIERTA', storeId: user.storeId }
        });

        if (activeSession) {
            return res.status(400).json({ error: 'Ya tienes una sesión de caja abierta.' });
        }

        const session = await prisma.sesionCaja.create({
            data: {
                vendedorId: userId,
                storeId: user.storeId,
                openingBalance: parseFloat(openingBalance),
                initialTags: parseInt(initialTags) || 0,
                estado: 'ABIERTA'
            }
        });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión de caja' });
    }
});

router.post('/cash-drawer/close', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { closingBalance } = req.body;

        const session = await prisma.sesionCaja.findFirst({
            where: { vendedorId: userId, estado: 'ABIERTA' },
            include: { transacciones: true, pedidos: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'No se encontró una sesión abierta.' });
        }

        const totalVentas = session.pedidos
            .filter(p => p.status === 'ENTREGADO' && p.paymentMethod === 'Efectivo')
            .reduce((sum, p) => sum + p.total, 0);
        
        const totalIngresos = session.transacciones
            .filter(t => t.tipo === 'INGRESO' || t.tipo === 'VENTA')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalRetiros = session.transacciones
            .filter(t => t.tipo === 'RETIRO' || t.tipo === 'CAMBIO')
            .reduce((sum, t) => sum + t.amount, 0);

        const expectedBalance = session.openingBalance + totalVentas + totalIngresos - totalRetiros;

        const closedSession = await prisma.sesionCaja.update({
            where: { id: session.id },
            data: {
                estado: 'CERRADA',
                endedAt: new Date(),
                closingBalance: parseFloat(closingBalance),
                expectedBalance: expectedBalance
            }
        });

        res.json(closedSession);
    } catch (error) {
        res.status(500).json({ error: 'Error al cerrar sesión de caja' });
    }
});

router.post('/cash-drawer/transaction', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amount, description } = req.body;

        const session = await prisma.sesionCaja.findFirst({
            where: { vendedorId: userId, estado: 'ABIERTA' }
        });

        if (!session) {
            return res.status(404).json({ error: 'No tienes una sesión de caja abierta.' });
        }

        const transaction = await prisma.transaccionCaja.create({
            data: {
                sesionId: session.id,
                tipo: type,
                amount: parseFloat(amount),
                description: description
            }
        });

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar movimiento' });
    }
});

router.post('/cash-drawer/report-tags', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { quantity } = req.body;

        const session = await prisma.sesionCaja.findFirst({
            where: { vendedorId: userId, estado: 'ABIERTA' }
        });

        if (!session) {
            return res.status(404).json({ error: 'No tienes una sesión de caja abierta.' });
        }

        const updatedSession = await prisma.sesionCaja.update({
            where: { id: session.id },
            data: {
                damagedTags: {
                    increment: parseInt(quantity)
                }
            }
        });

        res.json(updatedSession);
    } catch (error) {
        res.status(500).json({ error: 'Error al reportar etiquetas' });
    }
});

module.exports = router;
