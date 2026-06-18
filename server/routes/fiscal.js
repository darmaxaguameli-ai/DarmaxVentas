const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { getFacturapiClient } = require('../utils/facturapiService');

// --- LISTAR FACTURAS ---
router.get('/facturas', verifyToken, async (req, res) => {
    const { empresaId } = req.query;
    try {
        const facturas = await prisma.contableFactura.findMany({
            where: empresaId ? { empresaId } : {},
            orderBy: { fecha: 'desc' },
            include: { pedido: true }
        });
        res.json(facturas);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching facturas' });
    }
});

// --- TIMBRAR PEDIDO ---
router.post('/facturar-pedido', verifyToken, async (req, res) => {
    const { 
        pedidoId, empresaId, rfc, razonSocial, regimenFiscal, codigoPostal,
        payment_form, payment_method, use 
    } = req.body;

    try {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: { items: { include: { product: true, servicePrice: true } } }
        });

        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

        const facturapi = await getFacturapiClient(empresaId);

        const apiInvoice = await facturapi.createInvoiceFromPedido(
            pedido, 
            { rfc, razonSocial, regimenFiscal, codigoPostal },
            { payment_form, payment_method, use }
        );

        // 4. Guardar en base de datos local
        const nuevaFactura = await prisma.contableFactura.create({
            data: {
                facturapiId: apiInvoice.id,
                uuid: apiInvoice.uuid,
                folio: String(apiInvoice.folio_number),
                serie: apiInvoice.series,
                total: apiInvoice.total,
                status: apiInvoice.status,
                pdfUrl: `https://www.facturapi.io/v2/invoices/${apiInvoice.id}/pdf`,
                xmlUrl: `https://www.facturapi.io/v2/invoices/${apiInvoice.id}/xml`,
                empresaId,
                pedidoId
            }
        });

        res.status(201).json(nuevaFactura);
    } catch (error) {
        console.error('[Fiscal] Error facturando:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al procesar el timbrado con el PAC' });
    }
});

// --- CANCELAR FACTURA ---
router.post('/cancelar/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { motive } = req.body;

    try {
        const factura = await prisma.contableFactura.findUnique({ where: { id } });
        if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

        const facturapi = await getFacturapiClient(factura.empresaId);
        await facturapi.cancelInvoice(factura.facturapiId, motive);

        const actualizada = await prisma.contableFactura.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        res.json(actualizada);
    } catch (error) {
        res.status(500).json({ error: 'Error al cancelar factura' });
    }
});

module.exports = router;
