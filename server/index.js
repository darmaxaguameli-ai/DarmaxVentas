const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// 1. Seguridad de Cabeceras (Helmet)
// Configuración personalizada para permitir scripts de mapas/pdfs si es necesario
app.use(helmet({
  crossOriginResourcePolicy: false, // Permitir servir recursos locales como imágenes
  contentSecurityPolicy: false,      // Desactivado para simplificar con PDF/Renderer, habilitar en prod estricto
}));

// 2. CORS - Restringir a dominios conocidos
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://ventas-darmax-gestion.vercel.app',
    'https://darmaxagua.com.mx'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// 3. Rate Limiting (Protección contra fuerza bruta/DDoS)
const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 1000 peticiones por IP
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.' },
  skip: () => isRateLimitDisabled // ✅ Saltar si está desactivado en el .env
});
app.use('/api/', globalLimiter);

// Limitador específico para Login y Registro (más estricto)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 intentos de login por hora
  message: { error: 'Demasiados intentos de acceso. Por seguridad, tu IP ha sido bloqueada temporalmente.' },
  skip: () => isRateLimitDisabled // ✅ Saltar si está desactivado en el .env
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Servir archivos estáticos PUBLICOS (No confidenciales)
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs')));

// ------------------------------
// RUTAS MODULARES
// ------------------------------
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const logisticsRoutes = require('./routes/logistics');
const financeRoutes = require('./routes/finance');
const hrRoutes = require('./routes/hr');
const marketingRoutes = require('./routes/marketing');
const toolRoutes = require('./routes/tools');
const externalRoutes = require('./routes/external');
const reportRoutes = require('./routes/reports');
const promotionRoutes = require('./routes/promotions');

// ------------------------------
// ASIGNAR RUTAS (Todas bajo /api)
// ------------------------------
app.use('/api', authRoutes);
app.use('/api', productRoutes); 
app.use('/api', orderRoutes);
app.use('/api', userRoutes);
app.use('/api', roleRoutes);
app.use('/api', logisticsRoutes); 
app.use('/api', financeRoutes); 
app.use('/api', hrRoutes);
app.use('/api', marketingRoutes); 
app.use('/api', toolRoutes); 
app.use('/api', externalRoutes);
app.use('/api', reportRoutes);
app.use('/api', promotionRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.send('Server is running and fully modularized!');
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Servidor modularizado en puerto ${port}`);
  });
}

module.exports = app;
