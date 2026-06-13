const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');

// --- MARKETING POSTS ---
router.get('/marketing', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const user = req.fullUser;
    const isAdmin = user.role === 'ADMIN' || (user.roles && user.roles.some(r => r.name.toUpperCase() === 'ADMIN'));
    
    // Si es ADMIN ve todo, si no, solo lo propio
    const where = isAdmin ? {} : { creadorId: user.id };
    
    const posts = await prisma.marketingPost.findMany({ 
      where, 
      include: { creador: { select: { name: true, customId: true } } }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(posts);
  } catch (error) {
    console.error("Error en GET /marketing:", error);
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
    const { id } = req.params;
    const user = req.fullUser;
    const data = req.body;

    const existingPost = await prisma.marketingPost.findUnique({ where: { id } });
    if (!existingPost) return res.status(404).json({ error: 'Actividad no encontrada' });

    // Lógica de Permisos para Edición (Consistente con GET)
    const isAdmin = user.role === 'ADMIN' || (user.roles && user.roles.some(r => r.name.toUpperCase() === 'ADMIN'));
    const updateData = {};

    if (isAdmin) {
        Object.assign(updateData, {
            titulo: data.titulo,
            descripcion: data.descripcion,
            url: data.url,
            fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : undefined,
            fechaPublicacion: data.fechaPublicacion ? new Date(data.fechaPublicacion) : undefined,
            status: data.status,
            plataforma: data.plataforma,
            vistas: data.vistas !== undefined ? parseInt(data.vistas) : undefined,
            likes: data.likes !== undefined ? parseInt(data.likes) : undefined,
            compartidos: data.compartidos !== undefined ? parseInt(data.compartidos) : undefined,
            seguidoresGanados: data.seguidoresGanados !== undefined ? parseInt(data.seguidoresGanados) : undefined,
            isLive: data.isLive,
            comentariosAdmin: data.comentariosAdmin,
            editAuthorized: data.editAuthorized
        });
    } else {
        if (existingPost.creadorId !== user.id) return res.status(403).json({ error: 'No tienes permiso sobre esta actividad' });

        if (data.plataforma) updateData.plataforma = data.plataforma;
        if (data.requestEdit) updateData.comentariosAdmin = `[SOLICITUD DE EDICIÓN] ${new Date().toLocaleString()}: El colaborador solicita habilitar cambios.`;

        if (existingPost.editAuthorized || existingPost.status === 'BORRADOR') {
            if (data.titulo) updateData.titulo = data.titulo;
            if (data.descripcion) updateData.descripcion = data.descripcion;
            if (data.url) updateData.url = data.url;
            if (data.fechaEntrega) updateData.fechaEntrega = new Date(data.fechaEntrega);
        }

        if (existingPost.status === 'PUBLICADO') {
            updateData.vistas = data.vistas !== undefined ? parseInt(data.vistas) : undefined;
            updateData.likes = data.likes !== undefined ? parseInt(data.likes) : undefined;
            updateData.compartidos = data.compartidos !== undefined ? parseInt(data.compartidos) : undefined;
            updateData.seguidoresGanados = data.seguidoresGanados !== undefined ? parseInt(data.seguidoresGanados) : undefined;
        }

        if (data.status) {
            updateData.status = (data.status === 'APROBADO' || data.status === 'PUBLICADO') ? 'PENDIENTE_APROBACION' : data.status;
        }
    }

    const post = await prisma.marketingPost.update({ where: { id }, data: updateData });
    res.json(post);
  } catch (error) {
    console.error("Error en PUT /marketing:", error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
});

router.delete('/marketing/:id', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const user = req.fullUser;
    const isAdmin = user.role === 'ADMIN' || (user.roles && user.roles.some(r => r.name.toUpperCase() === 'ADMIN'));
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Solo los administradores pueden eliminar actividades.' });
    }
    await prisma.marketingPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error("Error en DELETE /marketing:", error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
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

// --- BLOG --- (Public access OK for GET)
router.get('/blog', async (req, res) => {
  const { slug, target } = req.query;
  try {
    if (slug) {
      const post = await prisma.blogPost.findUnique({ where: { slug } });
      return post ? res.json(post) : res.status(404).json({ error: 'Post not found' });
    }
    const where = target ? { target } : {};
    const posts = await prisma.blogPost.findMany({ 
        where,
        orderBy: { createdAt: 'desc' } 
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching blog posts' });
  }
});

router.post('/blog', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { title, excerpt, content, blocks, image, videoUrl, category, tags, published, author, target } = req.body;
    
    // Generar slug básico
    const slugBase = title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        blocks: blocks || [],
        image,
        videoUrl,
        category: category || 'Articulo',
        tags: tags || ['Darmax'],
        published: published ?? true,
        author: author || 'Darmax',
        target: target || 'WEB'
      }
    });
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

router.put('/blog/:id', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        blocks: data.blocks || undefined,
        image: data.image,
        videoUrl: data.videoUrl,
        category: data.category,
        tags: data.tags,
        published: data.published,
        author: data.author,
        target: data.target
      }
    });
    res.json(post);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: 'Error al actualizar artículo', message: error.message });
  }
});

router.delete('/blog/:id', verifyToken, requirePermission('canAccessMarketing'), async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
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
