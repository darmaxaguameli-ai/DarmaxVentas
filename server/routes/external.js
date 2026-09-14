const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../lib/prisma');

// --- GEOCODE ---
router.get('/external/geocode', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const fetchFromNominatim = async (q) => {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'DarmaxApp/1.0 (erick.rendon@galavi.com)' }
            });
            return response.data && response.data.length > 0 ? response.data[0] : null;
        } catch (error) { return null; }
    };
    try {
        let result = await fetchFromNominatim(query);
        if (result) return res.json({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), displayName: result.display_name });
        res.json({ lat: null, lng: null });
    } catch (error) {
        res.status(502).json({ error: 'Geocoding unavailable' });
    }
});

// --- DIPOMEX ---
router.get('/external/dipomex/codigo_postal', async (req, res) => {
  const { cp } = req.query;
  if (!cp) return res.status(400).json({ error: 'CP is required' });
  try {
    const response = await axios.get('https://api.tau.com.mx/dipomex/v1/codigo_postal', { params: { cp }, headers: { 'APIKEY': process.env.DIPOMEX_API_KEY } });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching postal code' });
  }
});

// ====================================================================
// --- COTIZACIONES DESDE DARMAXAGUA.COM.MX (CONFIGURADOR WEB) ---
// ====================================================================
const handleExternalCotizacionCreation = async (req, res) => {
  try {
    // 1. Validación de seguridad opcional por API Key (si está configurada en el .env)
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
    const configuredKey = process.env.DARMAXAGUA_API_KEY || process.env.EXTERNAL_API_KEY;

    if (configuredKey && apiKey !== configuredKey) {
      return res.status(401).json({ 
        error: 'No autorizado: API Key no válida o ausente para integración con darmaxagua.com.mx' 
      });
    }

    const body = req.body || {};
    const cliente = body.cliente || {};
    const costos = body.costos || {};
    const promo = body.promo || {};

    // 2. Validación de cliente (soporta formato anidado { cliente: { nombre } } o plano { nombreCliente })
    const nombreCliente = (cliente.nombre || body.nombreCliente || body.nombre || '').trim();
    if (!nombreCliente) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio para registrar la cotización.' });
    }

    const telefono = (cliente.telefono || body.telefono || '').trim() || null;
    const correo = (cliente.correo || body.correo || '').trim() || null;
    const cp = (cliente.cp || body.cp || '').trim() || null;

    // 3. Normalización de costos y modelo
    const modeloNombre = costos.modeloNombre || body.modeloNombre || 'Configuración Web Darmax';
    const modeloPrecio = parseFloat(costos.modelo ?? body.modeloPrecio ?? body.modelo ?? 0) || 0;
    const fleteTinacos = parseFloat(costos.fleteTinacos ?? body.fleteTinacos ?? 0) || 0;
    const viaticos = parseFloat(costos.viaticos ?? body.viaticos ?? 0) || 0;

    // 4. Extras seleccionados (soporta catálogo de extras del configurador web)
    const extras = body.extrasSeleccionados || body.extras || [];

    // 5. Promoción si aplica
    const promoTexto = promo.texto || body.promoTexto || null;
    const rawPromoCosto = promo.costo !== undefined ? promo.costo : body.promoCosto;
    const promoCosto = (rawPromoCosto !== undefined && rawPromoCosto !== null && rawPromoCosto !== "") 
      ? (parseFloat(rawPromoCosto) || null) 
      : null;
    const promoImagen = promo.imagenUrl || body.promoImagen || null;

    // 6. Asesor, validez y fecha
    const diasValidez = parseInt(body.diasValidez) || 5;
    const nombreAsesor = body.nombreAsesor || 'Sitio Web (darmaxagua.com.mx)';
    const firma = body.firma || null;
    const fecha = body.fecha ? new Date(body.fecha) : new Date();

    // 7. Registro en base de datos con Prisma
    const nuevaCotizacion = await prisma.cotizacion.create({
      data: {
        fecha,
        diasValidez,
        nombreAsesor,
        nombreCliente,
        telefono,
        correo,
        cp,
        modeloNombre,
        modeloPrecio,
        fleteTinacos,
        viaticos,
        extras,
        promoTexto,
        promoCosto,
        promoImagen,
        firma
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://ventas-darmax-gestion.vercel.app';
    const publicUrl = `${frontendUrl}/cotizacion/ver/${nuevaCotizacion.id}`;

    console.log(`[DARMAXAGUA EXTERNAL] Cotización #${nuevaCotizacion.folio} registrada con éxito para ${nombreCliente}`);

    return res.status(201).json({
      success: true,
      message: 'Cotización registrada con éxito desde darmaxagua.com.mx',
      folio: nuevaCotizacion.folio,
      id: nuevaCotizacion.id,
      publicUrl,
      cotizacion: nuevaCotizacion
    });

  } catch (error) {
    console.error('[DARMAXAGUA EXTERNAL] Error al procesar cotización:', error);
    return res.status(500).json({ 
      error: 'Error interno al registrar la cotización en el servidor.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Endpoints POST (soporta tanto plural, singular, como alias /cotizaciones/external)
router.post('/external/cotizaciones', handleExternalCotizacionCreation);
router.post('/external/cotizacion', handleExternalCotizacionCreation);
router.post('/cotizaciones/external', handleExternalCotizacionCreation);

// Endpoint GET para que darmaxagua.com.mx pueda consultar datos de una cotización por ID o Folio
router.get('/external/cotizaciones/:idOrFolio', async (req, res) => {
  try {
    const { idOrFolio } = req.params;
    const isNumeric = /^\d+$/.test(idOrFolio);
    
    const quote = isNumeric 
      ? await prisma.cotizacion.findFirst({ where: { folio: parseInt(idOrFolio) } })
      : await prisma.cotizacion.findUnique({ where: { id: idOrFolio } });

    if (!quote) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://ventas-darmax-gestion.vercel.app';
    const publicUrl = `${frontendUrl}/cotizacion/ver/${quote.id}`;

    res.json({
      ...quote,
      publicUrl
    });
  } catch (error) {
    console.error('[DARMAXAGUA EXTERNAL] Error al consultar cotización:', error);
    res.status(500).json({ error: 'Error al consultar cotización' });
  }
});

module.exports = router;

