const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// GET all roles
router.get('/roles', verifyToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// CREATE a new role
router.post('/roles', verifyToken, async (req, res) => {
  try {
    const { name, description, ...permissions } = req.body;
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Ya existe un rol con ese nombre.' });

    const newRole = await prisma.role.create({
      data: { name, description, isSystem: false, ...permissions }
    });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el rol' });
  }
});

// UPDATE a role
router.put('/roles/:id', verifyToken, async (req, res) => {
  try {
    const { id: roleIdParam } = req.params;
    const { id, name, description, userIds, _count, users, createdAt, updatedAt, isSystem, ...permissions } = req.body;
    const updateData = { ...permissions, name, description };
    Object.keys(updateData).forEach(key => (updateData[key] === undefined) && delete updateData[key]);
    if (userIds && Array.isArray(userIds)) {
        updateData.users = { set: userIds.map(uid => ({ id: uid })) };
    }
    const updatedRole = await prisma.role.update({
      where: { id: roleIdParam },
      data: updateData,
      include: { _count: { select: { users: true } } }
    });
    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
});

// DELETE a role
router.delete('/roles/:id', verifyToken, async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { users: true } } }
    });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado.' });
    if (role.isSystem) return res.status(400).json({ error: 'No se pueden eliminar roles del sistema.' });
    if (role._count.users > 0) return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados.' });
    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
});

module.exports = router;
