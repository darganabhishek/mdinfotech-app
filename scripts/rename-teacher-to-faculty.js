const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating Role and Permission names (Teacher -> Faculty)...');

  try {
    // 1. Rename 'teacher' role to 'faculty'
    const updatedRole = await prisma.role.updateMany({
      where: { name: { equals: 'teacher', mode: 'insensitive' } },
      data: { name: 'faculty' }
    });
    console.log(`- Updated ${updatedRole.count} role names.`);

    // 2. Rename 'teacher_portal' permission to 'faculty_portal'
    const updatedPermission = await prisma.permission.updateMany({
      where: { name: { equals: 'teacher_portal', mode: 'insensitive' } },
      data: { 
        name: 'faculty_portal',
        description: 'Access to the Faculty Portal and Attendance features'
      }
    });
    console.log(`- Updated ${updatedPermission.count} permission names.`);

    console.log('\n✨ Database migration complete.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
