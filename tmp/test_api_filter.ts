import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFilter(timeSlotId: number | null) {
  console.log(`\nTesting filter for timeSlotId: ${timeSlotId}`);
  
  const where: any = { status: 'active' };
  if (timeSlotId !== null) {
    where.batch = { timeSlotId: timeSlotId };
  }

  const admissions = await prisma.admission.findMany({
    where,
    include: {
      student: { select: { name: true, enrollmentNo: true } },
      batch: { select: { name: true, timeSlotId: true } }
    },
    take: 5
  });

  console.log(`Found ${admissions.length} admissions.`);
  admissions.forEach(adm => {
    console.log(`- ${adm.student.name} (${adm.student.enrollmentNo}) | Batch: ${adm.batch?.name} | Slot: ${adm.batch?.timeSlotId}`);
  });
}

async function main() {
  // Test All
  await testFilter(null);

  // Test Slot 1 (Sanil's slot)
  await testFilter(1);

  // Test a different Slot (e.g., 2)
  await testFilter(2);
  
  // Test another Slot (e.g., 3)
  await testFilter(3);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
