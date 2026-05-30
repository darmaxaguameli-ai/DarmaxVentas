const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { getVerificationEmailTemplate } = require('../utils/templates/authEmailTemplates');

// GET all users
router.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        store: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// GET user by customId or phone
router.get('/users/check', async (req, res) => {
  const { identifier, type } = req.query;
  if (!identifier || !type) {
    return res.status(400).json({ error: 'Identifier and type are required.' });
  }
  try {
    let user;
    if (type === 'customId') user = await prisma.user.findUnique({ where: { customId: identifier } });
    else if (type === 'phone') user = await prisma.user.findUnique({ where: { phone: identifier } });
    
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, hasPassword: !!password });
  } catch (error) {
    res.status(500).json({ error: 'Error checking user' });
  }
});

// GET single user
router.get('/users/:id', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        roles: true,
        store: true,
        loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// POST new user
router.post('/users', async (req, res) => {
  try {
    const data = req.body;
    const isExplicitCollaborator = data.type === 'COLABORADOR';
    let requestedRole = (data.role || (isExplicitCollaborator ? 'COLABORADOR' : (data.roleIds && data.roleIds.length > 0 ? 'COLABORADOR' : 'CLIENTE'))).toUpperCase().trim();
    if (requestedRole === 'VENTAS') requestedRole = 'VENTA';
    if (requestedRole === 'REPARTIDORES') requestedRole = 'REPARTIDOR';
    
    const isCollaborator = requestedRole !== 'CLIENTE' || isExplicitCollaborator;
    if (isCollaborator) {
        const authHeader = req.headers['authorization'];
        let isAdmin = false;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role === 'ADMIN') isAdmin = true;
            } catch (err) {}
        }
        if (!isAdmin) return res.status(403).json({ error: 'Permisos insuficientes para crear colaboradores.' });
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const roleConnections = [];
    try {
        const mainRole = await prisma.role.findUnique({ where: { name: requestedRole } });
        if (mainRole) roleConnections.push({ id: mainRole.id });
    } catch (e) {}

    if (data.roleIds && Array.isArray(data.roleIds)) {
        data.roleIds.forEach(id => {
            if (!roleConnections.some(rc => rc.id === id)) roleConnections.push({ id });
        });
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email?.toLowerCase().trim(),
        phone: data.phone,
        street: data.street || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        sexo: data.sexo || null,
        password: hashedPassword,
        clientCategory: data.category || data.clientCategory || 'PARTICULAR',
        role: requestedRole,
        type: isCollaborator ? 'COLABORADOR' : 'CLIENTE',
        verificationToken,
        mustChangePassword: !!hashedPassword,
        customId: data.customId || '',
        store: data.storeId ? { connect: { id: data.storeId } } : undefined,
        roles: roleConnections.length > 0 ? { connect: roleConnections } : undefined,
      },
    });

    if (newUser.email) {
        try {
            const verifyLink = `https://ventas-darmax-gestion.vercel.app/verify-email?token=${verificationToken}`;
            await sendEmail(newUser.email, 'Verifica tu cuenta en Darmax', getVerificationEmailTemplate({ name: newUser.name, verificationLink: verifyLink }));
        } catch (e) {}
    }
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El usuario ya existe.', message: 'Ya existe un usuario con el mismo email o teléfono.' });
    }
    res.status(500).json({ error: 'Error creating user', message: error.message });
  }
});

// PUT update user
router.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.user.role;
  const requesterIsAdmin = requesterRole === 'ADMIN';

  try {
    const data = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const updateData = {
      name: data.name || undefined,
      email: data.email === '' ? null : (data.email || undefined),
      phone: data.phone === '' ? null : (data.phone || undefined),
      street: data.street === '' ? null : (data.street || undefined),
      neighborhood: data.neighborhood === '' ? null : (data.neighborhood || undefined),
      city: data.city === '' ? null : (data.city || undefined),
      municipality: data.municipality === '' ? null : (data.municipality || undefined),
      state: data.state === '' ? null : (data.state || undefined),
      postalCode: data.postalCode === '' ? null : (data.postalCode || undefined),
      references: data.references === '' ? null : (data.references || undefined),
      sexo: data.sexo === '' ? null : (data.sexo || undefined),
      clientCategory: data.category || data.clientCategory || undefined,
      lat: data.lat === null ? null : (data.lat !== undefined ? parseFloat(data.lat) : undefined),
      lng: data.lng === null ? null : (data.lng !== undefined ? parseFloat(data.lng) : undefined),
      storeId: (requesterIsAdmin || id === req.user.id) && data.storeId !== undefined
          ? (data.storeId === '' || data.storeId === null ? null : data.storeId)
          : undefined
    };

    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    if (data.mustChangePassword !== undefined) updateData.mustChangePassword = data.mustChangePassword;

    if (requesterIsAdmin && data.role && data.role !== currentUser.role) {
        updateData.role = data.role;
        const isCollaborator = data.role.toUpperCase() !== 'CLIENTE';
        const rolePrefix = isCollaborator ? 'CO' : 'CLI';
        const random = String(Math.floor(Math.random() * 900) + 100);
        updateData.customId = `${rolePrefix}-${random}`;
    }

    if (requesterIsAdmin && data.roleIds && Array.isArray(data.roleIds)) {
        updateData.roles = {
            set: data.roleIds.map(rid => ({ id: rid }))
        };
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { store: true, roles: true, loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    let token = undefined;
    if (id === req.user.id) {
        token = jwt.sign(
            { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role, type: updatedUser.type, customId: updatedUser.customId, mustChangePassword: updatedUser.mustChangePassword },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
    }

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user', message: error.message });
  }
});

// DELETE user
router.delete('/users/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado.' });
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// --- USER PREFERENCES ---
router.get('/user-preferences', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { clientPreferences: true }
    });
    res.json(user?.clientPreferences || {});
  } catch (error) {
    res.status(500).json({ error: 'Error fetching preferences' });
  }
});

router.post('/user-preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { clientPreferences: preferences }
    });
    res.json({ message: 'Preferencias guardadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error saving preferences' });
  }
});

module.exports = router;
