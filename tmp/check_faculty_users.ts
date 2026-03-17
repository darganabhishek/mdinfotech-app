import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { in: ['Sandhya', 'Priyanka Pawar'] } },
    include: { role: true }
  });
  console.log('Users:', JSON.stringify(users, null, 2));

  const faculty = await prisma.faculty.findMany({
    where: { name: { in: ['Sandhya', 'Priyanka Pawar'] } }
  });
  console.log('Faculty:', JSON.stringify(faculty, null, 2));
}

main().catch(console.error);
