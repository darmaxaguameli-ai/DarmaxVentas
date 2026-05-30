const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- PROMOTIONS ---
router.get('/promotions', async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) {
      where.targetCategories = { has: category };
    }
    const promotions = await prisma.promotion.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching promotions' });
  }
});

router.post('/promotions', verifyToken, async (req, res) => {
  try {
    const promotion = await prisma.promotion.create({ data: req.body });
    res.status(201).json(promotion);
  } catch (error) {
    res.status(500).json({ error: 'Error creating promotion' });
  }
});

router.put('/promotions/:id', verifyToken, async (req, res) => {
  try {
    const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data: req.body });
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: 'Error updating promotion' });
  }
});

router.delete('/promotions/:id', verifyToken, async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting promotion' });
  }
});

module.exports = router;
