const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin@123', 12);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin',
      active: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.username}`);

  // 2. Create Courses
  const courses = [
    { name: 'Basic Computer Course', code: 'BCC', duration: 3, durationUnit: 'months', fee: 3000, description: 'MS Office, Internet, Email, Typing' },
    { name: 'Tally Prime with GST', code: 'TALLY', duration: 3, durationUnit: 'months', fee: 5000, description: 'Tally Prime, GST, Accounting, Inventory' },
    { name: 'Advanced Excel', code: 'AEXL', duration: 2, durationUnit: 'months', fee: 4000, description: 'Advanced Formulas, Pivot Tables, Macros, VBA' },
    { name: 'DCA (Diploma in Computer Application)', code: 'DCA', duration: 12, durationUnit: 'months', fee: 12000, description: 'Complete Computer Application Diploma' },
    { name: 'ADCA (Advanced Diploma)', code: 'ADCA', duration: 18, durationUnit: 'months', fee: 18000, description: 'Advanced Diploma in Computer Application' },
    { name: 'Web Development', code: 'WEBDEV', duration: 6, durationUnit: 'months', fee: 15000, description: 'HTML, CSS, JavaScript, React, Node.js' },
    { name: 'Python Programming', code: 'PYTHON', duration: 4, durationUnit: 'months', fee: 8000, description: 'Python basics to advanced with projects' },
    { name: 'Graphic Design', code: 'GFX', duration: 4, durationUnit: 'months', fee: 8000, description: 'Photoshop, Illustrator, CorelDRAW' },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: course,
    });
  }

  console.log('✅ Courses created');

  // 3. Create Batches
  const allCourses = await prisma.course.findMany();
  for (const course of allCourses) {
    const morningBatchName = `${course.code} - Morning Batch`;
    const eveningBatchName = `${course.code} - Evening Batch`;

    await prisma.batch.create({
      data: {
        name: morningBatchName,
        courseId: course.id,
        startDate: '2026-01-01',
        timing: '10:00 AM - 12:00 PM',
        instructor: 'TBD',
        capacity: 25,
        status: 'active',
      },
    });

    await prisma.batch.create({
      data: {
        name: eveningBatchName,
        courseId: course.id,
        startDate: '2026-01-01',
        timing: '4:00 PM - 6:00 PM',
        instructor: 'TBD',
        capacity: 25,
        status: 'active',
      },
    });
  }

  console.log('✅ Batches created');

  // 4. Create Initial Settings
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      instituteName: 'M.D. INFOTECH',
      tagline: 'Professional Computer Institute',
      address: '123 Tech Lane, Digital City, 54321',
      phone: '+91 9716161624',
      email: 'itmdinfotech@gmail.com',
    },
  });

  console.log('✅ Settings created');
  console.log('\n🚀 Database seeding complete!');
  console.log('📧 Login: admin / admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
