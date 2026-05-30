const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrando categorías existentes...');
  
  const products = await prisma.product.findMany({
    select: { category: true }
  });

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  for (const catName of uniqueCategories) {
    console.log(`Procesando: ${catName}`);
    const cat = await prisma.productCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName, isPublic: true }
    });

    await prisma.product.updateMany({
      where: { category: catName, categoryId: null },
      data: { categoryId: cat.id }
    });
  }

  console.log('Sincronización completada.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
