require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Configurar la conexión de PostgreSQL usando 'pg'
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: La variable de entorno DATABASE_URL no está definida.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Instanciar Prisma pasándole el adaptador explícitamente
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Iniciando población de Roles con Adaptador PG ---');

  const roles = [
    {
      name: 'ADMIN',
      description: 'Acceso total al sistema',
      canAccessPOS: true,
      canAccessOrders: true,
      canAccessDelivery: true,
      canAccessManagement: true,
      canAccessInventory: true,
      canAccessRH: true,
      canAccessFinances: true,
      canAccessConfig: true,
      canAccessQuotes: true,
      isSystem: true,
    },
    {
      name: 'VENDEDOR',
      description: 'Personal de ventas en mostrador',
      canAccessPOS: true,
      canAccessOrders: true,
      canAccessDelivery: false,
      canAccessManagement: true,
      canAccessInventory: true,
      canAccessRH: false,
      canAccessFinances: false,
      canAccessConfig: false,
      canAccessQuotes: true,
      isSystem: true,
    },
    {
      name: 'VENTA',
      description: 'Personal de apoyo en ventas',
      canAccessPOS: true,
      canAccessOrders: false,
      canAccessDelivery: false,
      canAccessManagement: false,
      canAccessInventory: false,
      canAccessRH: false,
      canAccessFinances: false,
      canAccessConfig: false,
      canAccessQuotes: false,
      isSystem: true,
    },
    {
      name: 'REPARTIDOR',
      description: 'Personal de entrega a domicilio',
      canAccessPOS: false,
      canAccessOrders: false,
      canAccessDelivery: true,
      canAccessManagement: false,
      canAccessInventory: false,
      canAccessRH: false,
      canAccessFinances: false,
      canAccessConfig: false,
      canAccessQuotes: false,
      isSystem: true,
    },
    {
      name: 'CLIENTE',
      description: 'Usuario final del sistema',
      canAccessPOS: false,
      canAccessOrders: true,
      canAccessDelivery: false,
      canAccessManagement: false,
      canAccessInventory: false,
      canAccessRH: false,
      canAccessFinances: false,
      canAccessConfig: false,
      canAccessQuotes: false,
      isSystem: true,
    }
  ];

  for (const role of roles) {
    const upsertedRole = await prisma.role.upsert({
      where: { name: role.name },
      update: role, 
      create: role,
    });
    console.log(`Rol creado/verificado: ${upsertedRole.name}`);
  }

  console.log('\n--- Vinculando usuarios actuales a roles ---');
  const allUsers = await prisma.user.findMany();
  
  for (const user of allUsers) {
    const matchingRole = await prisma.role.findUnique({
      where: { name: user.role }
    });

    if (matchingRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: matchingRole.id }
      });
      console.log(`Usuario ${user.name} (${user.role}) -> Rol ID: ${matchingRole.id}`);
    }
  }

  console.log('\n--- Población completada con éxito ---');
}

main()
  .catch((e) => {
    console.error('Error detallado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Cerrar el pool de conexiones
  });
