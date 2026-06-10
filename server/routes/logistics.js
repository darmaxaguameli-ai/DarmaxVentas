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

router.post('/franchises', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const franchise = await prisma.franchise.create({ data: { name } });
    res.status(201).json(franchise);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear franquicia' });
  }
});

router.put('/franchises/:id', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const franchise = await prisma.franchise.update({ where: { id: req.params.id }, data: { name } });
    res.json(franchise);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar franquicia' });
  }
});

router.delete('/franchises/:id', verifyToken, async (req, res) => {
  try {
    await prisma.franchise.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar franquicia' });
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

router.post('/stores', verifyToken, async (req, res) => {
  try {
    const { name, address, franchiseId, latitud, longitud } = req.body;
    const store = await prisma.store.create({
      data: {
        name,
        address,
        franchiseId,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null
      }
    });
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

router.put('/stores/:id', verifyToken, async (req, res) => {
  try {
    const { name, address, franchiseId, latitud, longitud } = req.body;
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        address: address || undefined,
        franchiseId: franchiseId || undefined,
        latitud: latitud !== undefined ? parseFloat(latitud) : undefined,
        longitud: longitud !== undefined ? parseFloat(longitud) : undefined
      }
    });
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
});

router.delete('/stores/:id', verifyToken, async (req, res) => {
  try {
    await prisma.store.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar sucursal' });
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
