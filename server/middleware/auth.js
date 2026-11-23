const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const checkDemoRole = (user) => {
    if (!user) return false;
    
    const roleNames = (user.roles || []).map(r => r.name.toUpperCase());
    const legacyRole = (user.role || '').toUpperCase();
    
    const demoKeywords = ['DEMO', 'VISITANTE', 'GUEST', 'PRUEBA'];
    
    const isDemo = demoKeywords.some(key => 
        legacyRole.includes(key) || 
        roleNames.some(name => name.includes(key))
    );

    return isDemo;
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Sesión no iniciada. Por favor accede al sistema.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Cargar usuario completo con sus roles y permisos para validaciones granulares
    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
            roles: {
                include: { permisos: true }
            },
            permisos: true
        }
    });

    if (!user) return res.status(401).json({ error: 'Usuario no válido o eliminado.' });

    // Guardar el objeto de usuario completo en la petición para uso posterior
    req.fullUser = user;

    if (req.method !== 'GET') {
        // ✅ EXCEPCIÓN: Permitir carga masiva protegida incluso en modo Demo si es necesario
        // O simplemente validar que el usuario no sea demo para el resto
        const isBulkImport = req.originalUrl.includes('/products/bulk');
        
        if (checkDemoRole(user) && !isBulkImport) {
            return res.status(403).json({ 
                error: 'Modo Demo Activo', 
                details: 'Esta cuenta es de solo lectura. No se permiten realizar cambios en la base de datos.' 
            });
        }
    }

    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(401).json({ error: 'Tu sesión ha expirado o es inválida. Por favor inicia sesión de nuevo.' });
  }
};

// Middleware para requerir un permiso específico (RBAC y permisos dinámicos)
const requirePermission = (permissionTarget) => {
    return async (req, res, next) => {
        if (!req.fullUser) return res.status(500).json({ error: 'Error de validación de permisos.' });

        const user = req.fullUser;
        const isAdmin = user.role === 'ADMIN' || user.roles.some(r => r.name.toUpperCase() === 'ADMIN');
        
        if (isAdmin) return next();

        const targets = Array.isArray(permissionTarget) ? permissionTarget : [permissionTarget];

        // 1. Validar por flags booleanos en roles
        const hasFlag = user.roles.some(role => targets.some(target => role[target] === true));
        if (hasFlag) return next();

        // 2. Validar por permisos directos del usuario
        const hasDirectPerm = (user.permisos || []).some(p => 
            targets.includes(p.codigo) || targets.includes(p.id)
        );
        if (hasDirectPerm) return next();

        // 3. Validar por permisos asociados a los roles del usuario
        const hasRolePerm = (user.roles || []).some(role => 
            (role.permisos || []).some(p => targets.includes(p.codigo) || targets.includes(p.id))
        );
        if (hasRolePerm) return next();

        const targetStr = targets.join(' o ');
        return res.status(403).json({ 
            error: 'Acceso Denegado', 
            details: `No tienes el permiso necesario (${targetStr}) para realizar esta acción.` 
        });
    };
};

module.exports = { verifyToken, checkDemoRole, requirePermission };
