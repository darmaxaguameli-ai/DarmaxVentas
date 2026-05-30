const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- CONSOLIDATED REPORT ---
router.get('/reports/consolidated', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado.' });
        const stores = await prisma.store.findMany({ select: { id: true, name: true } });
        const allIncomes = await prisma.ingreso.findMany({ select: { amount: true, storeId: true } });
        const allExpenses = await prisma.gasto.findMany({ select: { amount: true, storeId: true } });
        const reportMap = {};
        stores.forEach(store => { reportMap[store.id] = { id: store.id, name: store.name, totalIncome: 0, totalExpense: 0, netProfit: 0 }; });
        reportMap['global'] = { id: 'global', name: 'Operaciones Globales', totalIncome: 0, totalExpense: 0, netProfit: 0 };
        allIncomes.forEach(inc => { const key = inc.storeId && reportMap[inc.storeId] ? inc.storeId : 'global'; reportMap[key].totalIncome += (inc.amount || 0); });
        allExpenses.forEach(exp => { const key = exp.storeId && reportMap[inc.storeId] ? exp.storeId : 'global'; reportMap[key].totalExpense += (exp.amount || 0); });
        const report = Object.values(reportMap).map(item => ({ ...item, netProfit: item.totalIncome - item.totalExpense }));
        res.json(report.filter(item => item.id !== 'global' || (item.totalIncome > 0 || item.totalExpense > 0)));
    } catch (error) {
        res.status(500).json({ error: 'Error generating report' });
    }
});

module.exports = router;
