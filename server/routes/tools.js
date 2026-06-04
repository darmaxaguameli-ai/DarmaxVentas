const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de Multer para subir contratos (Carpeta PRIVADA)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../storage/contratos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'contrato-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.includes('word') || file.mimetype.includes('officedocument')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF o Word.'));
        }
    }
});

// --- COTIZACIONES ---
router.get('/cotizaciones', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
    try {
        const quotes = await prisma.cotizacion.findMany({ orderBy: { folio: 'desc' } });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quotes' });
    }
});

router.post('/cotizaciones', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
    try {
        const data = req.body;
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
        res.status(500).json({ error: 'Error al crear la cotización' });
    }
});

router.put('/cotizaciones/:id', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
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
        res.status(500).json({ error: 'Error al actualizar la cotización' });
    }
});

router.delete('/cotizaciones/:id', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
    try {
        await prisma.cotizacion.delete({ where: { id: req.params.id } });
        res.json({ message: 'Cotización eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la cotización' });
    }
});

router.get('/cotizaciones/:id', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
    try {
        const quote = await prisma.cotizacion.findUnique({ where: { id: req.params.id } });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote' });
    }
});

router.get('/cotizaciones/folio/:folio', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
    try {
        const quote = await prisma.cotizacion.findFirst({ where: { folio: parseInt(req.params.folio) } });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote by folio' });
    }
});

router.get('/cotizaciones/cliente/:nombre', verifyToken, requirePermission('canAccessQuotes'), async (req, res) => {
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

// GET public quote (NO verifyToken because it's public)
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
router.get('/solicitudes', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
    try {
        const solicitudes = await prisma.solicitudProducto.findMany({ orderBy: { folio: 'desc' } });
        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching requests' });
    }
});

router.post('/solicitudes', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.create({ data: req.body });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
});

router.get('/solicitudes/:id', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.findUnique({ where: { id: req.params.id } });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener solicitud' });
    }
});

router.get('/solicitudes/folio/:folio', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
    try {
        const solicitud = await prisma.solicitudProducto.findUnique({ where: { folio: parseInt(req.params.folio) } });
        res.json(solicitud);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener solicitud por folio' });
    }
});

router.put('/solicitudes/:id', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
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

router.delete('/solicitudes/:id', verifyToken, requirePermission('canAccessDistributorQuotes'), async (req, res) => {
    try {
        await prisma.solicitudProducto.delete({ where: { id: req.params.id } });
        res.json({ message: 'Solicitud eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar solicitud' });
    }
});

// --- LEGAL ---
router.get('/legal', verifyToken, requirePermission('canAccessLegal'), async (req, res) => {
    try {
        const documents = await prisma.legalDocument.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching legal documents' });
    }
});

router.post('/legal/upload', verifyToken, requirePermission('canAccessLegal'), upload.single('archivo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });
    const fileUrl = `storage/contratos/${req.file.filename}`;
    res.json({ url: fileUrl });
});

router.post('/legal', verifyToken, requirePermission('canAccessLegal'), async (req, res) => {
    try {
        const { nombre, descripcion, archivoUrl } = req.body;
        const document = await prisma.legalDocument.create({
            data: { nombre, descripcion, archivoUrl }
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Error creating legal document' });
    }
});

router.put('/legal/:id', verifyToken, requirePermission('canAccessLegal'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, archivoUrl } = req.body;
        const document = await prisma.legalDocument.update({
            where: { id },
            data: { nombre, descripcion, archivoUrl }
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Error updating legal document' });
    }
});

router.delete('/legal/:id', verifyToken, requirePermission('canAccessLegal'), async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Solo los administradores pueden borrar documentos legales.' });
        }
        await prisma.legalDocument.delete({ where: { id: req.params.id } });
        res.json({ message: 'Documento legal eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting legal document' });
    }
});

router.get('/legal/archivo/:id', verifyToken, requirePermission('canAccessLegal'), async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await prisma.legalDocument.findUnique({ where: { id } });
        if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

        const filePath = path.join(__dirname, '../../', doc.archivoUrl);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'El archivo físico no existe.' });

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el archivo.' });
    }
});

// --- INSTALLATION MODELS ---
router.get('/installation-models', verifyToken, requirePermission('canAccessInstallation'), async (req, res) => {
  try {
    const models = await prisma.installationModel.findMany({ include: { materials: { include: { product: true } } }, orderBy: { name: 'asc' } });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching models' });
  }
});

router.post('/installation-models', verifyToken, requirePermission('canAccessInstallation'), async (req, res) => {
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

router.put('/installation-models/:id', verifyToken, requirePermission('canAccessInstallation'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, materials } = req.body;
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

router.delete('/installation-models/:id', verifyToken, requirePermission('canAccessInstallation'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.modelMaterial.deleteMany({ where: { installationModelId: id } });
    await prisma.installationModel.delete({ where: { id } });
    res.json({ message: 'Modelo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar modelo' });
  }
});

// --- SHOWCASE INSTALLATIONS ---
router.get('/showcase', async (req, res) => {
    try {
        const installations = await prisma.showcaseInstallation.findMany({
            include: { 
                lead: { select: { nombre: true, createdAt: true, status: true } },
                legalDocument: { select: { nombre: true, archivoUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(installations);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching installations' });
    }
});

router.post('/showcase', verifyToken, requirePermission('canAccessShowcase'), async (req, res) => {
    try {
        const data = req.body;
        const installation = await prisma.showcaseInstallation.create({
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                direccion: data.direccion,
                ciudad: data.ciudad,
                estado: data.estado,
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng),
                descripcion: data.descripcion,
                fechaInstalacion: data.fechaInstalacion ? new Date(data.fechaInstalacion) : null,
                isPublic: data.isPublic !== undefined ? data.isPublic : true,
                lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
                legalDocument: data.legalDocumentId ? { connect: { id: data.legalDocumentId } } : undefined
            }
        });
        res.json(installation);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear punto de instalación' });
    }
});

router.put('/showcase/:id', verifyToken, requirePermission('canAccessShowcase'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const installation = await prisma.showcaseInstallation.update({
            where: { id },
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                direccion: data.direccion,
                ciudad: data.ciudad,
                estado: data.estado,
                lat: data.lat !== undefined ? parseFloat(data.lat) : undefined,
                lng: data.lng !== undefined ? parseFloat(data.lng) : undefined,
                descripcion: data.descripcion,
                fechaInstalacion: data.fechaInstalacion ? new Date(data.fechaInstalacion) : undefined,
                isPublic: data.isPublic,
                leadId: data.leadId || undefined,
                legalDocumentId: data.legalDocumentId || undefined
            }
        });
        res.json(installation);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar instalación' });
    }
});

router.delete('/showcase/:id', verifyToken, requirePermission('canAccessShowcase'), async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Solo los administradores pueden eliminar puntos.' });
    try {
        await prisma.showcaseInstallation.delete({ where: { id: req.params.id } });
        res.json({ message: 'Instalación eliminada del mapa' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar instalación' });
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
