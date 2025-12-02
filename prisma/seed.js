// require('dotenv').config(); // No es necesario, api/lib/prisma.js ya lo hace
const prisma = require('../api/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Iniciando el proceso de seeding...');

    const adminEmail = 'admin@darmax.com';
    const adminPassword = 'password123';

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log(`Contraseña para ${adminEmail} encriptada.`);

    // Crear o actualizar el usuario administrador
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            // No actualizamos nada si ya existe, pero podríamos hacerlo
        },
        create: {
            name: 'Max',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            customId: 'ADM-001', // ID personalizado para el admin
        },
    });

    console.log(`Usuario administrador "${adminUser.name}" creado/verificado con el email "${adminUser.email}".`);
    console.log('¡Seeding completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('Ocurrió un error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        // Cerrar la conexión a la base de datos
        await prisma.$disconnect();
    });
