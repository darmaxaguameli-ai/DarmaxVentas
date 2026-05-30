const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// --- COTIZACIONES ---
router.get('/cotizaciones', verifyToken, async (req, res) => {
    try {
        const quotes = await prisma.cotizacion.findMany({ orderBy: { folio: 'desc' } });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quotes' });
    }
});

// GET public quote
router.get('/cotizaciones/public/:id', async (req, res) => {
  try {
    const quote = await prisma.cotizacion.findUnique({ where: { id: req.params.id } });
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada.' });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching public quote' });
  }
});

// --- SOLICITUDES ---
router.get('/solicitudes', verifyToken, async (req, res) => {
    try {
        const solicitudes = await prisma.solicitudProducto.findMany({ orderBy: { folio: 'desc' } });
        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching requests' });
    }
});

// --- INSTALLATION MODELS ---
router.get('/installation-models', verifyToken, async (req, res) => {
  try {
    const models = await prisma.installationModel.findMany({ include: { materials: { include: { product: true } } }, orderBy: { name: 'asc' } });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching models' });
  }
});

// --- PDF LIST ---
router.get('/utils/pdfs', (req, res) => {
  const pdfsDir = path.join(__dirname, '../../public/pdfs');
  if (!fs.existsSync(pdfsDir)) return res.json([]);
  try {
    const files = fs.readdirSync(pdfsDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf')).map((file, index) => {
        const cleanName = file.replace(/\.pdf$/i, '').replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
        return { id: index + 1, name: cleanName, file: `/pdfs/${encodeURIComponent(file)}`, icon: 'description', color: 'text-primary' };
    });
    res.json(pdfFiles);
  } catch (error) {
    res.status(500).json({ error: 'Error reading PDFs' });
  }
});

module.exports = router;
