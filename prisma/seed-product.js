// prisma/seed-product.js
require('dotenv').config();

// Reutilizamos el mismo cliente que usa tu API
const prisma = require('../api/lib/prisma');

async function main() {
  const product = await prisma.producto.create({
    data: {
      // Ajusta estos campos a tu modelo real
      name: 'Agua Premium 20L',
      price: 35.5,
      stock: 100,
      imageUrl: null,
      category: 'agua',
    },
  });

  console.log('✅ Producto creado:', product);
}

main()
  .catch((e) => {
    console.error('❌ Error en la semilla:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
