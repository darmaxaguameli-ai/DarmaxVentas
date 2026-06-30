// server/lib/prisma.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  // Configuración del Pool: limitamos el tamaño de conexiones y el timeout para serverless
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,                      // Limitar a un pool moderado de 4 conexiones
    idleTimeoutMillis: 10000,    // Cerrar conexiones inactivas a los 10 segundos
    connectionTimeoutMillis: 3000,
  });

  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

prisma = globalForPrisma.prisma;

module.exports = prisma;


