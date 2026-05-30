const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Servir archivos estáticos
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
