require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL no definida.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Iniciando Migración RBAC v2 (Nuevos Nombres + Secuencias Atómicas) ---');

  // 1. Configurar Secuencias y Triggers en la BD
  console.log('\n--- Configurando Secuencias SQL y Triggers ---');
  if (fs.existsSync('prisma/setup_sequences.sql')) {
    const setupSql = fs.readFileSync('prisma/setup_sequences.sql', 'utf8');
    await prisma.$executeRawUnsafe(setupSql);
    console.log('Secuencias y Triggers de PostgreSQL creados/verificados.');
  }

  // 2. Asegurar que los roles base existen (Con los nuevos nombres)
  const baseRoles = [
    { name: 'ADMIN', isSystem: true },
    { name: 'MOSTRADOR', isSystem: true, description: 'Ventas en punto de venta físico' }, 
    { name: 'VENDEDOR', isSystem: true, description: 'Personal de ventas y atención' },  
    { name: 'REPARTIDOR', isSystem: true },
    { name: 'CLIENTE', isSystem: true },
    { name: 'MARKETING', isSystem: false },
  ];

  const roleMap = {};
  for (const r of baseRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, isSystem: r.isSystem, description: r.description }
    });
    roleMap[r.name] = role;
    console.log(`Rol verificado: ${role.name}`);
  }

  // 3. Migrar Usuarios y Renombrar Roles
  console.log('\n--- Actualizando Usuarios y Mapeando Roles ---');
  const allUsers = await prisma.user.findMany({
    include: { roles: true }
  });

  for (const user of allUsers) {
    const updates = {};
    
    // Mapeo de nombres antiguos a nuevos
    let currentRoleEnum = user.role; // El valor del enum legacy
    let targetRoleName = currentRoleEnum;

    if (currentRoleEnum === 'VENDEDOR') targetRoleName = 'MOSTRADOR';
    if (currentRoleEnum === 'VENTA') targetRoleName = 'VENDEDOR';

    const isInternal = ['ADMIN', 'MOSTRADOR', 'VENDEDOR', 'REPARTIDOR', 'MARKETING'].includes(targetRoleName);
    const newType = isInternal ? 'COLABORADOR' : 'CLIENTE';
    const prefix = newType === 'CLIENTE' ? 'CLI-' : 'CO-';

    // A. Actualizar IdentityType
    updates.type = newType;

    // B. Corregir Prefijo de customId
    if (user.customId && !user.customId.startsWith('CLI-') && !user.customId.startsWith('CO-')) {
        const numericPart = user.customId.replace(/[^0-9]/g, '').padStart(4, '0');
        updates.customId = `${prefix}${numericPart}`;
    }

    // C. Conectar al nuevo Rol (Muchos a Muchos)
    if (user.roles.length === 0 && targetRoleName && roleMap[targetRoleName]) {
        updates.roles = {
            connect: { id: roleMap[targetRoleName].id }
        };
    }

    if (Object.keys(updates).length > 0) {
        await prisma.user.update({
            where: { id: user.id },
            data: updates
        });
        console.log(`User [${user.name}]: Role Legacy (${currentRoleEnum}) -> Nuevo (${targetRoleName}). ID: ${updates.customId || user.customId}`);
    }
  }

  // 4. Sincronizar Secuencias
  console.log('\n--- Sincronizando Secuencias ---');
  await prisma.$executeRawUnsafe(`
    SELECT setval('user_cliente_seq', COALESCE((SELECT MAX(CAST(substring("customId" FROM '[0-9]+') AS INTEGER)) FROM "User" WHERE "customId" LIKE 'CLI-%'), 0) + 1, false);
    SELECT setval('user_colaborador_seq', COALESCE((SELECT MAX(CAST(substring("customId" FROM '[0-9]+') AS INTEGER)) FROM "User" WHERE "customId" LIKE 'CO-%'), 0) + 1, false);
  `);
  console.log('Secuencias sincronizadas.');

  console.log('\n--- Migración Finalizada con éxito ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
