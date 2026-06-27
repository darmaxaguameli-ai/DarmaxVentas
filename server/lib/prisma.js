// api/lib/prisma.js
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Usamos globalThis para evitar múltiples instancias y pools en entornos serverless (Vercel) y desarrollo
const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  // Limitar a un pool máximo de 2 conexiones por contenedor y cerrar hilos inactivos rápidamente (15s)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 3000,
  });

  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

prisma = globalForPrisma.prisma;

module.exports = prisma;
