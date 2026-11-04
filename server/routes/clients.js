const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// =====================================================================
// RUTAS DE CLIENTES (CRM / DIRECTORIO INDEPENDIENTE)
// =====================================================================

// 1. GET all clients
router.get('/clients', async (req, res) => {
  try {
    const { storeId, searchTerm } = req.query;

    const where = {};
    if (storeId) {
      where.storeId = storeId;
    }
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { customId: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.cliente.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, address: true }
        },
        _count: {
          select: { pedidos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(clients);
  } catch (error) {
    console.error('Error in GET /clients:', error);
    res.status(500).json({ error: 'Error al obtener la lista de clientes', details: error.message });
  }
});

// 2. GET check client (Public check for POS counter sales & Self-service)
router.get('/clients/check', async (req, res) => {
  const { identifier, type } = req.query;
  if (!identifier) {
    return res.status(400).json({ error: 'Identificador requerido.' });
  }

  try {
    const where = {};
    if (type === 'phone') {
      where.phone = identifier.trim();
    } else {
      where.customId = identifier.trim().toUpperCase();
    }

    const client = await prisma.cliente.findFirst({
      where,
      include: {
        store: { select: { id: true, name: true } }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error in GET /clients/check:', error);
    res.status(500).json({ error: 'Error al verificar cliente' });
  }
});

// 3. GET single client by ID
router.get('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.cliente.findUnique({
      where: { id },
      include: {
        store: true,
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        pedidos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error in GET /clients/:id:', error);
    res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
  }
});

// 4. POST create client
router.post('/clients', async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
    }

    // Si no viene customId, generamos uno atómico con la secuencia o fallback
    let customId = data.customId;
    if (!customId || customId.trim() === '') {
      let isIdUnique = false;
      while (!isIdUnique) {
        const random = String(Math.floor(Math.random() * 9000) + 1000);
        customId = `CLI-${random}`;
        const existing = await prisma.cliente.findUnique({ where: { customId } });
        if (!existing) isIdUnique = true;
      }
    }

    const newClient = await prisma.cliente.create({
      data: {
        customId,
        name: data.name.trim(),
        email: data.email && data.email.trim() !== '' ? data.email.toLowerCase().trim() : null,
        phone: data.phone && data.phone.trim() !== '' ? data.phone.trim() : null,
        street: data.street || null,
        neighborhood: data.neighborhood || null,
        municipality: data.municipality || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        references: data.references || null,
        lat: data.lat !== undefined && data.lat !== null && data.lat !== '' ? parseFloat(data.lat) : null,
        lng: data.lng !== undefined && data.lng !== null && data.lng !== '' ? parseFloat(data.lng) : null,
        sexo: data.sexo || null,
        clientCategory: data.category || data.clientCategory || 'PARTICULAR',
        clientPreferences: data.clientPreferences || [],
        purchaseFrequencyDays: data.purchaseFrequencyDays !== undefined && data.purchaseFrequencyDays !== null && data.purchaseFrequencyDays !== '' ? parseInt(data.purchaseFrequencyDays) : null,
        lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : null,
        store: data.storeId ? { connect: { id: data.storeId } } : undefined
      },
      include: {
        store: true
      }
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'teléfono o correo';
      return res.status(409).json({
        error: 'El cliente ya existe.',
        message: `Ya existe un cliente con el mismo valor en el campo único: '${field}'.`
      });
    }
    res.status(500).json({ error: 'Error al registrar cliente', message: error.message });
  }
});

// 5. PUT update client
router.put('/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;

    const existingClient = await prisma.cliente.findUnique({ where: { id } });
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const updateData = {
      name: data.name !== undefined ? data.name : undefined,
      email: data.email === '' ? null : (data.email || undefined),
      phone: data.phone === '' ? null : (data.phone || undefined),
      street: data.street === '' ? null : (data.street || undefined),
      neighborhood: data.neighborhood === '' ? null : (data.neighborhood || undefined),
      municipality: data.municipality === '' ? null : (data.municipality || undefined),
      city: data.city === '' ? null : (data.city || undefined),
      state: data.state === '' ? null : (data.state || undefined),
      postalCode: data.postalCode === '' ? null : (data.postalCode || undefined),
      references: data.references === '' ? null : (data.references || undefined),
      sexo: data.sexo === '' ? null : (data.sexo || undefined),
      clientCategory: data.category || data.clientCategory || undefined,
      lat: data.lat === null ? null : (data.lat !== undefined && data.lat !== '' ? parseFloat(data.lat) : undefined),
      lng: data.lng === null ? null : (data.lng !== undefined && data.lng !== '' ? parseFloat(data.lng) : undefined),
      purchaseFrequencyDays: data.purchaseFrequencyDays !== undefined ? (data.purchaseFrequencyDays === '' || data.purchaseFrequencyDays === null ? null : parseInt(data.purchaseFrequencyDays)) : undefined,
      clientPreferences: data.clientPreferences !== undefined ? data.clientPreferences : undefined,
      lastPurchaseDate: data.lastPurchaseDate !== undefined ? (data.lastPurchaseDate === '' || data.lastPurchaseDate === null ? null : new Date(data.lastPurchaseDate)) : undefined,
      storeId: data.storeId !== undefined ? (data.storeId === '' || data.storeId === null ? null : data.storeId) : undefined
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await prisma.cliente.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'teléfono o correo';
      return res.status(409).json({
        error: 'Conflicto de duplicidad',
        message: `Ya existe otro cliente con el mismo valor en '${field}'.`
      });
    }
    res.status(500).json({ error: 'Error al actualizar cliente', message: error.message });
  }
});

// 6. DELETE client
router.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.cliente.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
  }
});

module.exports = router;
