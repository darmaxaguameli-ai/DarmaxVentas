require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL no definida en el .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function renameRole(oldName, newName) {
    console.log(`\n--- Procesando: ${oldName} -> ${newName} ---`);
    
    try {
        // 1. Buscar el rol antiguo y el nuevo
        const oldRole = await prisma.role.findUnique({ 
            where: { name: oldName },
            include: { users: true }
        });
        
        const newRole = await prisma.role.findUnique({ 
            where: { name: newName } 
        });

        if (!oldRole) {
            console.log(`⚠️  El rol "${oldName}" no existe. Saltando...`);
            return;
        }

        if (newRole) {
            console.log(`ℹ️  El rol "${newName}" ya existe. Fusionando usuarios...`);
            
            // Mover usuarios del viejo al nuevo (Relación Muchos a Muchos)
            for (const user of oldRole.users) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        roles: {
                            connect: { id: newRole.id },
                            disconnect: { id: oldRole.id }
                        }
                    }
                });
            }
            
            // Eliminar el rol viejo ya vacío
            await prisma.role.delete({ where: { id: oldRole.id } });
            console.log(`✅ Usuarios movidos a "${newName}" y rol "${oldName}" eliminado.`);
        } else {
            // Simplemente renombrar si el destino no existe
            await prisma.role.update({
                where: { id: oldRole.id },
                data: { name: newName }
            });
            console.log(`✅ Rol "${oldName}" renombrado exitosamente a "${newName}".`);
        }
    } catch (error) {
        console.error(`❌ Error procesando ${oldName}:`, error.message);
    }
}

async function main() {
    console.log('🚀 Iniciando corrección de nombres de roles (Modo Adapter)...');

    // 1. VENDEDOR (viejo) -> MOSTRADOR (nuevo)
    await renameRole('VENDEDOR', 'MOSTRADOR');

    // 2. VENTA (viejo) -> VENDEDOR (nuevo)
    await renameRole('VENTA', 'VENDEDOR');

    console.log('\n✨ Proceso finalizado.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
