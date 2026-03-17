import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batchId = 98;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { timeSlot: true }
  });

  if (!batch) {
    console.log(`Batch ${batchId} not found`);
    return;
  }

  console.log(`Batch ID: ${batch.id}`);
  console.log(`Name: ${batch.name}`);
  console.log(`Time Slot ID: ${batch.timeSlotId}`);
  if (batch.timeSlot) {
    console.log(`Time Slot Label: ${batch.timeSlot.label}`);
  } else {
    console.log('Time Slot: NULL');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
