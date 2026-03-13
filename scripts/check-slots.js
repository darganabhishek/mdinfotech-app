const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const timeSlots = await prisma.timeSlot.findMany();
  console.log(timeSlots);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
