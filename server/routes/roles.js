const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// Middleware para verificar que el usuario tenga acceso a Sistemas o sea Administrador
const requireSistemasOrAdmin = (req, res, next) => {
  const user = req.fullUser;
  if (!user) return res.status(401).json({ error: 'No autenticado. Por favor inicia sesión.' });

  const isAdmin = user.role === 'ADMIN' || (user.roles || []).some(r => r.name?.toUpperCase() === 'ADMIN');
  if (isAdmin) return next();

  const hasSistemas = (user.roles || []).some(r => 
    r.canAccessSistemas || 
    r.canManageSistemas || 
    (r.permisos || []).some(p => p.codigo === 'acceso.sistemas')
  ) || (user.permisos || []).some(p => p.codigo === 'acceso.sistemas') ||
  user.canAccessSistemas || user.canManageSistemas;

  if (!hasSistemas) {
    return res.status(403).json({ 
      error: 'Acceso restringido. Esta sección y sus funciones dependen del permiso de Sistemas (acceso.sistemas) o Administrador.' 
    });
  }
  next();
};

// =====================================================================
// 1. RUTAS DE ROLES MAESTROS
// =====================================================================

// GET all roles (con sus permisos, usuarios y conteos)
router.get('/roles', verifyToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true, permisos: true } },
        permisos: {
          select: { id: true, codigo: true, nombre: true, moduloId: true, submoduloId: true }
        },
        users: {
          select: { id: true, name: true, customId: true, email: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Error al obtener roles', details: error.message });
  }
});

// POST crear nuevo rol maestro
router.post('/roles', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { name, description, isSystem, permisoIds, userIds, ...legacyPermissions } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre del rol es obligatorio.' });
    }

    const cleanName = name.trim().toUpperCase();
    const existing = await prisma.role.findUnique({ where: { name: cleanName } });
    if (existing) {
      return res.status(400).json({ error: `Ya existe un rol con el nombre "${cleanName}".` });
    }

    const data = {
      name: cleanName,
      description: description || null,
      isSystem: !!isSystem,
      ...legacyPermissions
    };

    if (permisoIds && Array.isArray(permisoIds) && permisoIds.length > 0) {
      data.permisos = {
        connect: permisoIds.map(id => ({ id }))
      };
    }

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      data.users = {
        connect: userIds.map(id => ({ id }))
      };
    }

    const newRole = await prisma.role.create({
      data,
      include: {
        _count: { select: { users: true, permisos: true } },
        permisos: true,
        users: { select: { id: true, name: true, customId: true, email: true } }
      }
    });

    res.status(201).json(newRole);
  } catch (error) {
    console.error('Error al crear el rol:', error);
    res.status(500).json({ error: error.message || 'Error al crear el rol' });
  }
});

// PUT actualizar estructura, permisos y colaboradores del rol
router.put('/roles/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { id: roleIdParam } = req.params;
    const {
      id,
      name,
      description,
      userIds,
      permisoIds,
      _count,
      users,
      permisos,
      createdAt,
      updatedAt,
      isSystem,
      ...legacyPermissions
    } = req.body;

    const existingRole = await prisma.role.findUnique({ where: { id: roleIdParam } });
    if (!existingRole) {
      return res.status(404).json({ error: 'Rol no encontrado.' });
    }

    const updateData = {
      description: description !== undefined ? description : undefined,
      ...legacyPermissions
    };

    // No renombrar roles del sistema
    if (name && (!existingRole.isSystem || existingRole.name === name)) {
      updateData.name = name.trim().toUpperCase();
    }

    // Actualizar permisos vinculados
    if (permisoIds && Array.isArray(permisoIds)) {
      updateData.permisos = {
        set: permisoIds.map(pid => ({ id: pid }))
      };
    }

    // Actualizar usuarios vinculados
    if (userIds && Array.isArray(userIds)) {
      updateData.users = {
        set: userIds.map(uid => ({ id: uid }))
      };
    }

    Object.keys(updateData).forEach(key => (updateData[key] === undefined) && delete updateData[key]);

    const updatedRole = await prisma.role.update({
      where: { id: roleIdParam },
      data: updateData,
      include: {
        _count: { select: { users: true, permisos: true } },
        permisos: true,
        users: { select: { id: true, name: true, customId: true, email: true } }
      }
    });

    res.json(updatedRole);
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar el rol' });
  }
});

// DELETE eliminar rol
router.delete('/roles/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true } } }
    });

    if (!role) return res.status(404).json({ error: 'Rol no encontrado.' });
    if (role.isSystem) return res.status(400).json({ error: 'No se pueden eliminar roles nativos del sistema.' });
    if (role._count.users > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el rol porque tiene ${role._count.users} colaborador(es) asignado(s). Reasígnalos primero.` 
      });
    }

    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol', details: error.message });
  }
});

// =====================================================================
// 2. RUTAS DE MÓDULOS, SUBMÓDULOS Y PERMISOS DINÁMICOS
// =====================================================================

// GET estructura completa del árbol de módulos, submódulos y permisos
router.get('/modules', verifyToken, async (req, res) => {
  try {
    const modules = await prisma.modulo.findMany({
      orderBy: { orden: 'asc' },
      include: {
        submodulos: {
          orderBy: { orden: 'asc' },
          include: {
            permisos: {
              orderBy: { codigo: 'asc' }
            }
          }
        },
        permisos: {
          orderBy: { codigo: 'asc' }
        }
      }
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Error al obtener módulos y permisos', details: error.message });
  }
});

// POST crear un nuevo módulo y su permiso maestro automático
router.post('/modules', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { codigo, nombre, icono, orden } = req.body;
    if (!nombre || !codigo) {
      return res.status(400).json({ error: 'Nombre y código son obligatorios.' });
    }

    const cleanCodigo = codigo.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = await prisma.modulo.findUnique({ where: { codigo: cleanCodigo } });
    if (existing) {
      return res.status(400).json({ error: `Ya existe un módulo con el código "${cleanCodigo}".` });
    }

    const newModule = await prisma.modulo.create({
      data: {
        codigo: cleanCodigo,
        nombre: nombre.trim(),
        icono: icono?.trim() || 'folder',
        orden: orden !== undefined ? parseInt(orden) : 99
      }
    });

    // Auto-generar permiso raíz para el módulo: "acceso.<codigo>"
    const permCodigo = `acceso.${cleanCodigo}`;
    const existingPerm = await prisma.permiso.findUnique({ where: { codigo: permCodigo } });
    if (!existingPerm) {
      await prisma.permiso.create({
        data: {
          codigo: permCodigo,
          nombre: `Acceso al módulo de ${newModule.nombre}`,
          descripcion: `Permite visualizar y navegar en el módulo ${newModule.nombre}`,
          moduloId: newModule.id
        }
      });
    }

    const completeModule = await prisma.modulo.findUnique({
      where: { id: newModule.id },
      include: {
        submodulos: { include: { permisos: true } },
        permisos: true
      }
    });

    res.status(201).json(completeModule);
  } catch (error) {
    console.error('Error al crear módulo:', error);
    res.status(500).json({ error: error.message || 'Error al crear módulo' });
  }
});

// PUT actualizar módulo
router.put('/modules/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { nombre, icono, orden, activo } = req.body;
    const updated = await prisma.modulo.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre ? nombre.trim() : undefined,
        icono: icono ? icono.trim() : undefined,
        orden: orden !== undefined ? parseInt(orden) : undefined,
        activo: activo !== undefined ? !!activo : undefined
      },
      include: {
        submodulos: { include: { permisos: true } },
        permisos: true
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar módulo' });
  }
});

// DELETE eliminar módulo (con sus submódulos y permisos en cascada)
router.delete('/modules/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    await prisma.modulo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    res.status(500).json({ error: 'Error al eliminar módulo', details: error.message });
  }
});

// POST crear un nuevo submódulo y su permiso automático
router.post('/submodules', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { moduloId, codigo, nombre, path, icono, orden } = req.body;
    if (!moduloId || !nombre || !codigo || !path) {
      return res.status(400).json({ error: 'Módulo padre, nombre, código y ruta (path) son requeridos.' });
    }

    const cleanCodigo = codigo.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = await prisma.submodulo.findUnique({ where: { codigo: cleanCodigo } });
    if (existing) {
      return res.status(400).json({ error: `Ya existe un submódulo con el código "${cleanCodigo}".` });
    }

    const newSubmodule = await prisma.submodulo.create({
      data: {
        moduloId,
        codigo: cleanCodigo,
        nombre: nombre.trim(),
        path: path.trim().replace(/^\//, ''),
        icono: icono?.trim() || 'circle',
        orden: orden !== undefined ? parseInt(orden) : 99
      }
    });

    // Auto-generar permiso para el submódulo: "acceso.<codigo>"
    const permCodigo = `acceso.${cleanCodigo}`;
    const existingPerm = await prisma.permiso.findUnique({ where: { codigo: permCodigo } });
    if (!existingPerm) {
      await prisma.permiso.create({
        data: {
          codigo: permCodigo,
          nombre: `Acceso a ${newSubmodule.nombre}`,
          descripcion: `Permite ingresar a la pantalla de ${newSubmodule.nombre}`,
          submoduloId: newSubmodule.id,
          moduloId
        }
      });
    }

    const completeSubmodule = await prisma.submodulo.findUnique({
      where: { id: newSubmodule.id },
      include: { permisos: true, modulo: true }
    });

    res.status(201).json(completeSubmodule);
  } catch (error) {
    console.error('Error al crear submódulo:', error);
    res.status(500).json({ error: error.message || 'Error al crear submódulo' });
  }
});

// PUT actualizar submódulo
router.put('/submodules/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { nombre, path, icono, orden, activo } = req.body;
    const updated = await prisma.submodulo.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre ? nombre.trim() : undefined,
        path: path ? path.trim().replace(/^\//, '') : undefined,
        icono: icono ? icono.trim() : undefined,
        orden: orden !== undefined ? parseInt(orden) : undefined,
        activo: activo !== undefined ? !!activo : undefined
      },
      include: { permisos: true, modulo: true }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar submódulo:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar submódulo' });
  }
});

// DELETE eliminar submódulo
router.delete('/submodules/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    await prisma.submodulo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar submódulo:', error);
    res.status(500).json({ error: 'Error al eliminar submódulo', details: error.message });
  }
});

// GET todos los permisos disponibles
router.get('/permissions', verifyToken, async (req, res) => {
  try {
    const permissions = await prisma.permiso.findMany({
      orderBy: { codigo: 'asc' },
      include: {
        modulo: { select: { id: true, nombre: true, codigo: true } },
        submodulo: { select: { id: true, nombre: true, codigo: true } }
      }
    });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
});

// POST crear un permiso personalizado
router.post('/permissions', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { codigo, nombre, descripcion, moduloId, submoduloId } = req.body;
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre del permiso son requeridos.' });
    }

    let cleanCodigo = codigo.trim().toLowerCase();
    if (!cleanCodigo.startsWith('acceso.')) {
      cleanCodigo = `acceso.${cleanCodigo}`;
    }

    const existing = await prisma.permiso.findUnique({ where: { codigo: cleanCodigo } });
    if (existing) {
      return res.status(400).json({ error: `Ya existe un permiso con el código "${cleanCodigo}".` });
    }

    const newPermiso = await prisma.permiso.create({
      data: {
        codigo: cleanCodigo,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        moduloId: moduloId || null,
        submoduloId: submoduloId || null
      },
      include: {
        modulo: true,
        submodulo: true
      }
    });

    res.status(201).json(newPermiso);
  } catch (error) {
    console.error('Error al crear permiso:', error);
    res.status(500).json({ error: error.message || 'Error al crear permiso' });
  }
});

// DELETE eliminar un permiso personalizado
router.delete('/permissions/:id', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    await prisma.permiso.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar permiso:', error);
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
});

// =====================================================================
// 3. ASIGNACIÓN DIRECTA DE ROLES A COLABORADORES
// =====================================================================

// GET todos los colaboradores para asignación de roles
router.get('/collaborators', verifyToken, async (req, res) => {
  try {
    const collaborators = await prisma.user.findMany({
      where: {
        OR: [
          { type: 'COLABORADOR' },
          { role: { not: 'CLIENTE' } }
        ]
      },
      select: {
        id: true,
        customId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        type: true,
        store: { select: { id: true, name: true } },
        roles: {
          include: {
            permisos: {
              select: { id: true, codigo: true, nombre: true }
            }
          }
        },
        permisos: {
          select: { id: true, codigo: true, nombre: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Error al obtener colaboradores' });
  }
});

// PUT actualizar los roles asignados a un colaborador
router.put('/users/:id/roles', verifyToken, requireSistemasOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'roleIds debe ser un arreglo de IDs de roles.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: roleIds.map(rid => ({ id: rid }))
        }
      },
      select: {
        id: true,
        customId: true,
        name: true,
        email: true,
        role: true,
        roles: {
          include: {
            permisos: { select: { id: true, codigo: true, nombre: true } }
          }
        },
        permisos: { select: { id: true, codigo: true, nombre: true } }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar roles de usuario:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar roles del colaborador' });
  }
});

module.exports = router;
