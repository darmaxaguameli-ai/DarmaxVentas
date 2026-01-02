// require('dotenv').config(); // No es necesario, api/lib/prisma.js ya lo hace
const prisma = require('../api/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Iniciando el proceso de seeding...');

    // 1. Crear la Franquicia Principal
    const franchise = await prisma.franchise.upsert({
        where: { name: 'Darmax Agua' },
        update: {},
        create: {
            name: 'Darmax Agua',
        },
    });
    console.log(`Franquicia "${franchise.name}" creada.`);

    // 2. Crear la Sucursal Principal
    const store = await prisma.store.upsert({
        // Usamos una combinación única o buscamos por nombre si es único, 
        // pero upsert requiere un campo @unique. Como 'name' no es unique en Store (pero debería serlo por franquicia),
        // usaremos findFirst para verificar si existe, si no, create.
        where: { id: 'store-boulevard-fix-id' }, // Hack para upsert: usamos un ID fijo o lo manejamos manualmente
        update: {},
        create: {
            id: 'store-boulevard-fix-id', // ID fijo para evitar duplicados en re-seeds
            name: 'Boulevard de los Continentes',
            address: 'Boulevard de los Continentes 85, Bosques de Aragon, 57170 Cdad. Nezahualcóyotl, Méx.',
            franchise: { connect: { id: franchise.id } },
            latitud: 19.4689,
            longitud: -99.0518
        },
    });
    // Nota: Si el upsert falla por no encontrar el ID, es mejor usar la lógica de "buscar o crear" si no se tiene ID fijo.
    // Pero para seeds controlados, IDs fijos funcionan bien.
    console.log(`Sucursal "${store.name}" creada.`);


    // 3. Crear Usuario Admin
    const adminEmail = 'admin@darmax.com';
    const adminPassword = 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            // Si ya existe, nos aseguramos que tenga la tienda asignada (opcional, ya que es ADMIN global)
            // store: { connect: { id: store.id } } 
        },
        create: {
            name: 'Max',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            customId: 'ADM-001',
            // Opcional: Asignar al admin a la sucursal principal por defecto, aunque sea global
            store: { connect: { id: store.id } } 
        },
    });

    console.log(`Usuario administrador "${adminUser.name}" creado/verificado.`);
    console.log('¡Seeding completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('Ocurrió un error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
