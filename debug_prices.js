
const prisma = require('./api/lib/prisma');

async function main() {
  const prices = await prisma.servicePrice.findMany({
    include: {
        waterType: true,
        jugBrands: true
    }
  });
  console.log(JSON.stringify(prices, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect(); // The lib instance might manage this differently or be global
    // But for a script we should exit
    process.exit(0);
  });
