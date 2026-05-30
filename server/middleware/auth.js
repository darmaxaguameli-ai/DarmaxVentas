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
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.method !== 'GET') {
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { roles: true }
        });

        if (checkDemoRole(user)) {
            return res.status(403).json({ 
                error: 'Modo Demo Activo', 
                details: 'Esta cuenta es de solo lectura para fines de presentación empresarial. No se permite realizar cambios en la base de datos.' 
            });
        }
    }

    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = { verifyToken, checkDemoRole };
