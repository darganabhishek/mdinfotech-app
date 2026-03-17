import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const enrollmentNo = 'MDI26031726';
  console.log(`Checking admissions for student: ${enrollmentNo}`);

  const student = await prisma.student.findUnique({
    where: { enrollmentNo },
    include: {
      admissions: {
        include: {
          batch: {
            include: {
              timeSlot: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log(`Student ID: ${student.id}, Name: ${student.name}`);
  console.log(`Number of admissions: ${student.admissions.length}`);

  student.admissions.forEach((adm, index) => {
    console.log(`\nAdmission ${index + 1}:`);
    console.log(`  ID: ${adm.id}`);
    console.log(`  Status: ${adm.status}`);
    console.log(`  Batch ID: ${adm.batchId}`);
    if (adm.batch) {
      console.log(`  Batch Name: ${adm.batch.name}`);
      console.log(`  Time Slot ID: ${adm.batch.timeSlotId}`);
      if (adm.batch.timeSlot) {
        console.log(`  Time Slot Label: ${adm.batch.timeSlot.label}`);
      } else {
        console.log(`  Time Slot: NULL`);
      }
    } else {
      console.log('  Batch: NULL');
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
