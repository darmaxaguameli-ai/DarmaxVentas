require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixUser(email, roleName, customId) {
    console.log(`\n--- Corrigiendo: ${email} ---`);
    try {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            console.error(`❌ Rol ${roleName} no encontrado.`);
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                type: 'COLABORADOR',
                customId: customId,
                roles: {
                    set: [{ id: role.id }] // Usar set para limpiar y asignar solo este rol
                }
            }
        });
        console.log(`✅ ${email} ahora es ${roleName} con ID ${customId}`);
    } catch (e) {
        console.error(`❌ Error con ${email}: ${e.message}`);
    }
}

async function main() {
  console.log('🚀 Iniciando rescate de cuentas de colaboradores...');

  // 1. BRANDON -> VENDEDOR
  await fixUser('ventas.brandon@darmaxagua.mx', 'VENDEDOR', 'CO-0002');

  // 2. MOSTRADOR -> MOSTRADOR
  await fixUser('mostrador@darmaxagua.mx', 'MOSTRADOR', 'CO-0003');

  // 3. REPARTIDOR -> REPARTIDOR
  await fixUser('repartidor1@darmaxagua.mx', 'REPARTIDOR', 'CO-0004');

  console.log('\n✨ Proceso finalizado.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
