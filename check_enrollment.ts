
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lastStudent = await prisma.student.findFirst({
    orderBy: {
      enrollmentNo: 'desc'
    },
    select: {
      enrollmentNo: true
    }
  });
  console.log('Last Enrollment Number:', lastStudent?.enrollmentNo);
  
  const allStudents = await prisma.student.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      enrollmentNo: true,
      name: true
    }
  });
  console.log('Recent 10 Students:', allStudents);
}

main().catch(console.error).finally(() => prisma.$disconnect());
