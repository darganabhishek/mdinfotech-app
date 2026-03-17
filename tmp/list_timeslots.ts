import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: { startTime: 'asc' }
  });

  console.log('Available Time Slots:');
  timeSlots.forEach(ts => {
    console.log(`ID: ${ts.id} | Label: ${ts.label} | Timing: ${ts.startTime} - ${ts.endTime}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
