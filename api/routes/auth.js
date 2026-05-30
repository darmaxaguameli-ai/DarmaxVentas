const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { getResetPasswordEmailTemplate, getVerificationEmailTemplate } = require('../utils/templates/authEmailTemplates');
const axios = require('axios');

// --- Geocoding Function (Shared helper if needed locally) ---
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'DarmaxApp/1.0 (erick.rendon@galavi.com)' }
    });
    if (response.data && response.data.length > 0) {
      return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
    }
    return { lat: null, lng: null };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: null, lng: null };
  }
};

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email: identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes('@');
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: cleanIdentifier.toLowerCase() } : { customId: cleanIdentifier.toUpperCase() },
      include: { store: true, roles: true }
    });
    if (!user || !user.password) return res.status(401).json({ error: 'Credenciales inválidas.' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Credenciales inválidas.' });
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, type: user.type, customId: user.customId, mustChangePassword: user.mustChangePassword },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es requerido.' });
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: token, resetPasswordExpires: expires } });
    const frontendUrl = process.env.FRONTEND_URL || 'https://ventas-darmax-gestion.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    await sendEmail(user.email, 'Recuperación de contraseña de Darmax', getResetPasswordEmailTemplate({ name: user.name, resetLink }));
    res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

// POST /api/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
  try {
    const user = await prisma.user.findFirst({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } } });
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado.' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null } });
    res.json({ message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
});

// POST /api/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'El token es requerido.' });
  try {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), verificationToken: null } });
    res.json({ message: 'Correo verificado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar el correo.' });
  }
});

// POST /api/register-client
router.post('/register-client', async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.phone) return res.status(400).json({ error: 'Nombre y teléfono son requeridos.' });
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) return res.status(409).json({ error: 'Este número de teléfono ya está registrado.' });
    
    let coordinates = { lat: data.lat || null, lng: data.lng || null };
    if (!coordinates.lat && !coordinates.lng && data.street && data.city) {
        coordinates = await geocodeAddress(`${data.street}, ${data.neighborhood || ''}, ${data.city}, ${data.postalCode || ''}`);
    }
    const roleRecord = await prisma.role.findUnique({ where: { name: 'CLIENTE' } });
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        street: data.street || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        municipality: data.municipality || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        references: data.references || null,
        lat: coordinates.lat ? parseFloat(coordinates.lat) : null,
        lng: coordinates.lng ? parseFloat(coordinates.lng) : null,
        role: 'CLIENTE',
        clientCategory: data.clientCategory || 'PARTICULAR',
        customId: '',
        roles: roleRecord ? { connect: [{ id: roleRecord.id }] } : undefined,
      },
    });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el cliente.' });
  }
});

// POST /api/complete-registration
router.post('/complete-registration', async (req, res) => {
  try {
    const { userId, email, password, name, sexo } = req.body;
    if (!userId || !password) return res.status(400).json({ error: 'Faltan datos requeridos.' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.password) return res.status(409).json({ error: 'Este usuario ya está registrado.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: email || user.email, name: name || user.name, sexo: sexo || user.sexo, password: hashedPassword, verificationToken, emailVerified: null },
    });
    const targetEmail = email || user.email;
    if (targetEmail) {
        const verifyLink = `https://ventas-darmax-gestion.vercel.app/verify-email?token=${verificationToken}`;
        await sendEmail(targetEmail, 'Verifica tu cuenta en Darmax', getVerificationEmailTemplate({ name: updatedUser.name, verificationLink: verifyLink }));
    }
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Error al completar el registro.' });
  }
});

module.exports = router;
