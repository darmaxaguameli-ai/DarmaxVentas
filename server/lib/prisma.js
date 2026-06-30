// server/lib/prisma.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

  // Configuración del Pool: optimizado para evitar problemas de cold-starts y caídas de conexión en Serverless
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: isVercel ? 2 : 4,                      // Limitar a 2 en Serverless y 4 en Local
    idleTimeoutMillis: isVercel ? 5000 : 10000,  // Cerrar conexiones inactivas más rápido en Vercel
    connectionTimeoutMillis: isVercel ? 15000 : 5000, // Dar suficiente tiempo (15s) en Vercel para despertar la BD
  });

  // Evitar crasheos por conexiones inactivas que el servidor de base de datos corta inesperadamente
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

prisma = globalForPrisma.prisma;

module.exports = prisma;


