import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { username: 'sandhya' },
    include: { role: { include: { permissions: true } } }
  });
  console.log(JSON.stringify(user, null, 2));

  const allPermissions = await prisma.permission.findMany();
  console.log("ALL PERMISSIONS: ", JSON.stringify(allPermissions.map(p => p.name), null, 2));
}
main().finally(() => prisma.$disconnect());
