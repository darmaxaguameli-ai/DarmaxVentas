const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// --- MARKETING POSTS ---
router.get('/marketing', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const where = role !== 'ADMIN' ? { creadorId: id } : {};
    const posts = await prisma.marketingPost.findMany({ where, include: { creador: { select: { name: true, customId: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching marketing posts' });
  }
});

// --- LEADS ---
router.get('/leads', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const where = role !== 'ADMIN' ? { vendedorId: id } : {};
    const leads = await prisma.lead.findMany({ where, include: { vendedor: { select: { name: true, customId: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leads' });
  }
});

// --- BLOG ---
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
