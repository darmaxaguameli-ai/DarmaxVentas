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

router.post('/cotizaciones', verifyToken, async (req, res) => {
    try {
        const data = req.body;
        // Convertir tipos si es necesario
        const quote = await prisma.cotizacion.create({
            data: {
                fecha: data.fecha ? new Date(data.fecha) : new Date(),
                diasValidez: parseInt(data.diasValidez) || 5,
                nombreAsesor: data.nombreAsesor,
                nombreCliente: data.cliente.nombre,
                telefono: data.cliente.telefono,
                correo: data.cliente.correo,
                cp: data.cliente.cp,
                modeloNombre: data.costos.modeloNombre,
                modeloPrecio: parseFloat(data.costos.modelo) || 0,
                fleteTinacos: parseFloat(data.costos.fleteTinacos) || 0,
                viaticos: parseFloat(data.costos.viaticos) || 0,
                extras: data.extrasSeleccionados || [],
                promoTexto: data.promo.texto,
                promoCosto: parseFloat(data.promo.costo) || null,
                promoImagen: data.promo.imagenUrl,
                firma: data.firma
            }
        });
        res.json(quote);
    } catch (error) {
        console.error("Error creating quote:", error);
        res.status(500).json({ error: 'Error al crear la cotización', details: error.message });
    }
});

router.put('/cotizaciones/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const quote = await prisma.cotizacion.update({
            where: { id },
            data: {
                fecha: data.fecha ? new Date(data.fecha) : undefined,
                diasValidez: parseInt(data.diasValidez) || undefined,
                nombreAsesor: data.nombreAsesor,
                nombreCliente: data.cliente?.nombre,
                telefono: data.cliente?.telefono,
                correo: data.cliente?.correo,
                cp: data.cliente?.cp,
                modeloNombre: data.costos?.modeloNombre,
                modeloPrecio: data.costos?.modelo !== undefined ? parseFloat(data.costos.modelo) : undefined,
                fleteTinacos: data.costos?.fleteTinacos !== undefined ? parseFloat(data.costos.fleteTinacos) : undefined,
                viaticos: data.costos?.viaticos !== undefined ? parseFloat(data.costos.viaticos) : undefined,
                extras: data.extrasSeleccionados || undefined,
                promoTexto: data.promo?.texto,
                promoCosto: data.promo?.costo !== undefined ? (data.promo.costo === "" ? null : parseFloat(data.promo.costo)) : undefined,
                promoImagen: data.promo?.imagenUrl,
                firma: data.firma
            }
        });
        res.json(quote);
    } catch (error) {
        console.error("Error updating quote:", error);
        res.status(500).json({ error: 'Error al actualizar la cotización', details: error.message });
    }
});

router.delete('/cotizaciones/:id', verifyToken, async (req, res) => {
    try {
        await prisma.cotizacion.delete({ where: { id: req.params.id } });
        res.json({ message: 'Cotización eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la cotización' });
    }
});

router.get('/cotizaciones/:id', verifyToken, async (req, res) => {
    try {
        const quote = await prisma.cotizacion.findUnique({ where: { id: req.params.id } });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote' });
    }
});

router.get('/cotizaciones/folio/:folio', verifyToken, async (req, res) => {
    try {
        const quote = await prisma.cotizacion.findFirst({ where: { folio: parseInt(req.params.folio) } });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote by folio' });
    }
});

router.get('/cotizaciones/cliente/:nombre', verifyToken, async (req, res) => {
    try {
        const quotes = await prisma.cotizacion.findMany({ 
            where: { nombreCliente: { contains: req.params.nombre, mode: 'insensitive' } },
            orderBy: { fecha: 'desc' }
        });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quotes by client' });
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

router.post('/solicitudes', verifyToken, async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.create({ data: req.body });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
});

router.get('/solicitudes/:id', verifyToken, async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.findUnique({ where: { id: req.params.id } });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener solicitud' });
    }
});

router.get('/solicitudes/folio/:folio', verifyToken, async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.findUnique({ where: { folio: parseInt(req.params.folio) } });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener solicitud por folio' });
    }
});

router.put('/solicitudes/:id', verifyToken, async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar solicitud' });
    }
});

router.delete('/solicitudes/:id', verifyToken, async (req, res) => {
    try {
        await prisma.solicitudProducto.delete({ where: { id: req.params.id } });
        res.json({ message: 'Solicitud eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar solicitud' });
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

router.post('/installation-models', verifyToken, async (req, res) => {
  try {
    const { name, description, materials } = req.body;
    const model = await prisma.installationModel.create({
      data: {
        name,
        description,
        materials: {
          create: materials.map(m => ({
            quantity: parseFloat(m.quantity),
            unit: m.unit,
            productId: m.productId
          }))
        }
      },
      include: { materials: true }
    });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear modelo de instalación' });
  }
});

router.put('/installation-models/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, materials } = req.body;
    
    // Primero eliminar materiales existentes para reemplazarlos (simplificación)
    await prisma.modelMaterial.deleteMany({ where: { installationModelId: id } });

    const model = await prisma.installationModel.update({
      where: { id },
      data: {
        name,
        description,
        materials: {
          create: materials.map(m => ({
            quantity: parseFloat(m.quantity),
            unit: m.unit,
            productId: m.productId
          }))
        }
      },
      include: { materials: true }
    });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar modelo de instalación' });
  }
});

router.delete('/installation-models/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.modelMaterial.deleteMany({ where: { installationModelId: id } });
    await prisma.installationModel.delete({ where: { id } });
    res.json({ message: 'Modelo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar modelo' });
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
