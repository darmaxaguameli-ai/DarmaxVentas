const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const roles = await prisma.role.findMany();
    console.log('CONEXIÓN EXITOSA:', roles.length, 'roles encontrados.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR CRÍTICO PRISMA:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();

