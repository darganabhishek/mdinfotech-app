import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiLogic(timeSlotIdParam: string | null) {
  console.log(`\nTesting API logic for timeSlotIdParam: "${timeSlotIdParam}"`);
  
  const status = 'active';
  const timeSlotId = timeSlotIdParam;

  const where: any = {};
  if (status) where.status = status;
  if (timeSlotId && timeSlotId !== 'undefined') {
    where.batch = { timeSlotId: parseInt(timeSlotId) };
  }

  console.log('Generated where:', JSON.stringify(where, null, 2));

  const admissions = await prisma.admission.findMany({
    where,
    include: {
      student: { select: { name: true, enrollmentNo: true } },
      batch: { select: { id: true, name: true, timeSlotId: true } }
    },
    take: 5
  });

  console.log(`Found ${admissions.length} admissions.`);
  admissions.forEach(adm => {
    console.log(`- ${adm.student.name} (${adm.student.enrollmentNo}) | Batch ID: ${adm.batch?.id} | Slot: ${adm.batch?.timeSlotId}`);
  });
}

async function main() {
  // Test All (timeSlotId null)
  await testApiLogic(null);

  // Test Slot 1
  await testApiLogic("1");

  // Test Slot 2
  await testApiLogic("2");

  // Test "undefined" string (security check)
  await testApiLogic("undefined");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
