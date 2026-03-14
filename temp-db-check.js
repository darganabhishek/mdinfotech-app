const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findFirst({
    where: { username: 'sandhya' },
    include: {
      role: {
        include: { permissions: true }
      }
    }
  });

  console.log('Teacher Role:', teacher.role.name);
  console.log('Teacher Perms:', teacher.role.permissions.map(p => p.name).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
