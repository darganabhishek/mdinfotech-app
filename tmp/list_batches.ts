import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batch.findMany({
    include: {
      timeSlot: true,
      _count: {
        select: { admissions: true }
      }
    }
  });

  console.log('Available Batches:');
  batches.forEach(b => {
    console.log(`ID: ${b.id} | Name: ${b.name} | Slot ID: ${b.timeSlotId} | Slot: ${b.timeSlot?.label} | Admissions: ${b._count.admissions}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
