// server/lib/prisma.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Usamos globalThis para evitar múltiples instancias en desarrollo (HMR)
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;

