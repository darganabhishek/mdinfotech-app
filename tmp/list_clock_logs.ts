import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.facultyClockLog.findMany({
    include: { faculty: true },
    orderBy: { clockIn: 'desc' },
    take: 10
  });
  console.log('Recent Logs:', JSON.stringify(logs.map(l => ({
    id: l.id,
    facultyId: l.facultyId,
    facultyName: l.faculty.name,
    clockIn: l.clockIn
  })), null, 2));
}

main().catch(console.error);
