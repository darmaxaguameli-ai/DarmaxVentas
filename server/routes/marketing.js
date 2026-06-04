const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');

// --- MARKETING POSTS ---
router.get('/marketing', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { id, role } = req.user;
    const where = role !== 'ADMIN' ? { creadorId: id } : {};
    const posts = await prisma.marketingPost.findMany({ 
      where, 
      include: { creador: { select: { name: true, customId: true } } }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching marketing posts' });
  }
});

router.post('/marketing', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { titulo, descripcion, url, fechaEntrega, status, plataforma } = req.body;
    const post = await prisma.marketingPost.create({
      data: {
        titulo,
        descripcion,
        url,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        status: status || 'BORRADOR',
        plataforma,
        creadorId: req.user.id
      }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error creating marketing post' });
  }
});

router.put('/marketing/:id', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { titulo, descripcion, url, fechaEntrega, fechaPublicacion, status, plataforma, vistas, likes, compartidos, seguidoresGanados, isLive, comentariosAdmin } = req.body;
    const post = await prisma.marketingPost.update({
      where: { id: req.params.id },
      data: {
        titulo,
        descripcion,
        url,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined,
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : undefined,
        status,
        plataforma,
        vistas: vistas !== undefined ? parseInt(vistas) : undefined,
        likes: likes !== undefined ? parseInt(likes) : undefined,
        compartidos: compartidos !== undefined ? parseInt(compartidos) : undefined,
        seguidoresGanados: seguidoresGanados !== undefined ? parseInt(seguidoresGanados) : undefined,
        isLive,
        comentariosAdmin
      }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error updating marketing post' });
  }
});

router.delete('/marketing/:id', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    await prisma.marketingPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting marketing post' });
  }
});

// --- SOCIAL MEDIA METRICS ---
router.get('/marketing/metrics', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const metrics = await prisma.socialMediaMetric.findMany({
      orderBy: { fecha: 'desc' },
      take: 100
    });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching social media metrics' });
  }
});

router.post('/marketing/metrics', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { plataforma, seguidores, fecha } = req.body;
    const targetDate = fecha ? new Date(fecha) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const metric = await prisma.socialMediaMetric.upsert({
      where: {
        plataforma_fecha: {
          plataforma,
          fecha: targetDate
        }
      },
      update: { seguidores: parseInt(seguidores) },
      create: {
        plataforma,
        seguidores: parseInt(seguidores),
        fecha: targetDate
      }
    });
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Error saving social media metric' });
  }
});

// --- LEADS ---
router.get('/leads', verifyToken, requirePermission('canAccessLeads'), async (req, res) => {
  try {
    const { id, role } = req.user;
    const where = role !== 'ADMIN' ? { vendedorId: id } : {};
    const leads = await prisma.lead.findMany({ where, include: { vendedor: { select: { name: true, customId: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leads' });
  }
});

// --- BLOG --- (Public access OK)
router.get('/blog', async (req, res) => {
  const { slug } = req.query;
  try {
    if (slug) {
      const post = await prisma.blogPost.findUnique({ where: { slug } });
      return post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
    }
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blog posts' });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 30 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

router.post('/notifications', verifyToken, async (req, res) => {
  try {
    const { title, message, type, link, icon, userId } = req.body;
    const targetUserId = userId || req.user.id;
    const notification = await prisma.notification.create({
      data: { title, message, type: type || 'INFO', link, icon, userId: targetUserId }
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Error creating notification' });
  }
});

router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Error updating notification' });
  }
});

router.delete('/notifications', verifyToken, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error clearing notifications' });
  }
});

module.exports = router;
