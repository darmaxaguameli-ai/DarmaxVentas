const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  }
}

test();
