
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const mdiStudents = await prisma.student.findMany({
    where: {
      enrollmentNo: {
        startsWith: 'MDI'
      }
    },
    orderBy: {
      enrollmentNo: 'desc'
    },
    take: 5
  });
  console.log('Last MDI Enrollment Numbers:', mdiStudents.map(s => s.enrollmentNo));
  
  const lastAny = await prisma.student.findFirst({
    orderBy: { id: 'desc' },
    select: { enrollmentNo: true }
  });
  console.log('Absolute Last Student Enrollment:', lastAny?.enrollmentNo);
}

main().catch(console.error).finally(() => prisma.$disconnect());
