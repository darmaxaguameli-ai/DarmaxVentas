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

    // Cargar usuario completo con sus roles para validaciones granulares
    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { roles: true }
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

// Middleware para requerir un permiso específico (RBAC)
const requirePermission = (permissionName) => {
    return async (req, res, next) => {
        if (!req.fullUser) return res.status(500).json({ error: 'Error de validación de permisos.' });

        const user = req.fullUser;
        const isAdmin = user.role === 'ADMIN' || user.roles.some(r => r.name.toUpperCase() === 'ADMIN');
        
        if (isAdmin) return next();

        const hasPerm = user.roles.some(role => role[permissionName] === true);
        
        if (hasPerm) return next();

        return res.status(403).json({ 
            error: 'Acceso Denegado', 
            details: `No tienes el permiso necesario (${permissionName}) para realizar esta acción.` 
        });
    };
};

module.exports = { verifyToken, checkDemoRole, requirePermission };
