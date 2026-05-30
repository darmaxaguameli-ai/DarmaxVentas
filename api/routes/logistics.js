const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- FRANCHISES ---
router.get('/franchises', verifyToken, async (req, res) => {
  try {
    const franchises = await prisma.franchise.findMany({ include: { stores: true }, orderBy: { name: 'asc' } });
    res.json(franchises);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching franchises' });
  }
});

// --- STORES ---
router.get('/stores', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({ include: { franchise: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stores' });
  }
});

router.get('/stores/nearest', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude are required' });
    try {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const stores = await prisma.store.findMany({ where: { latitud: { not: null }, longitud: { not: null } } });
        if (stores.length === 0) return res.status(404).json({ error: 'No stores found' });
        let nearestStore = null;
        let minDistance = Infinity;
        const toRad = (value) => (value * Math.PI) / 180;
        stores.forEach(store => {
            const R = 6371;
            const dLat = toRad(store.latitud - userLat);
            const dLon = toRad(store.longitud - userLng);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(userLat)) * Math.cos(toRad(store.latitud)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            if (d < minDistance) {
                minDistance = d;
                nearestStore = { ...store, distanceKm: d };
            }
        });
        res.json(nearestStore);
    } catch (error) {
        res.status(500).json({ error: 'Error calculating nearest store' });
    }
});

module.exports = router;
