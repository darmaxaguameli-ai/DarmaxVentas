// api/lib/prisma.js
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');      // 👈 CAMBIO CLAVE
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

console.log('DATABASE_URL =>', process.env.DATABASE_URL); // 👈 DEBUG (puedes quitarlo luego)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Usamos globalThis para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
