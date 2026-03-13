const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin@123', 12);

  // 0. Clear existing data related to courses/batches to avoid conflicts
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  console.log('🗑️  Cleared existing courses and batches');

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

  // 2. Create New Courses from Flyers
  const courses = [
    { name: 'Basic Tech with AI', code: 'BT-AI', duration: 3, durationUnit: 'months', fee: 0, description: 'Computer Fundamentals, Internet, Word, Excel, PowerPoint, AI Basics' },
    { name: "Office X'pert with AI", code: 'OX-AI', duration: 6, durationUnit: 'months', fee: 0, description: 'Comprehensive Office Suite with Access, Outlook, Publisher, Typing & Advanced AI' },
    { name: 'Master Class with AI', code: 'MC-AI', duration: 1, durationUnit: 'months', fee: 0, description: 'Prompt Engineering, Workflows, AI Agents, Agentic AI IDE' },
    { name: 'Advance Excel', code: 'ADV-EXCEL', duration: 2, durationUnit: 'months', fee: 0, description: 'Fundamentals, Advanced Formulas, Data Cleaning, Dashboards, What-If Analysis' },
    { name: 'Master Excel with AI', code: 'MEX-AI', duration: 3, durationUnit: 'months', fee: 0, description: 'Advanced Excel with AI Integration, Power Tools, and Macros with AI' },
    { name: 'Power BI with AI', code: 'PBI-AI', duration: 3, durationUnit: 'months', fee: 0, description: 'Business Intelligence, Power Query, DAX, Interactive Dashboard Design with AI Features' },
    { name: 'Data & Business Intelligence', code: 'DBI', duration: 6, durationUnit: 'months', fee: 0, description: 'SQL, Power BI, Python, AI in Data & BI, Business Case Studies' },
    { name: 'Tally Prime', code: 'TALLY', duration: 2, durationUnit: 'months', fee: 0, description: 'Accounting Fundamentals, Voucher Entry, Inventory, Manufacturing, Reports' },
    { name: 'Tally Prime with GST + AI', code: 'TALLY-AI', duration: 4, durationUnit: 'months', fee: 0, description: 'GST inside Tally, TDS & TCS, Payroll, AI Integration with Tally' },
    { name: 'Professional Accounts & MIS Master', code: 'MIS-MASTER', duration: 12, durationUnit: 'months', fee: 0, description: 'Tally Prime with GST+AI, Advanced Excel, Data Handling, MIS Reporting & Automation' },
    { name: 'AI-Powered Ecommerce Master Program', code: 'ECOMM-AI', duration: 3, durationUnit: 'months', fee: 0, description: 'Sell on Amazon/Flipkart, GST for Sellers, Inventory, Logistics, Digital Marketing with AI' },
    { name: 'Rich Before 40 Program', code: 'FINANCE', duration: 2, durationUnit: 'months', fee: 0, description: 'Money Mindset, Investments, Mutual Funds, Stock Market, Tax Planning, Wealth Strategy' },
    { name: 'No-Code Graphic & Web Design Master with AI', code: 'DESIGN-AI', duration: 4, durationUnit: 'months', fee: 0, description: 'Design Fundamentals, Canva, AI for Graphics, No-Code Websites, AI Builders, Freelancing' },
    { name: 'C & C++ Programming Master', code: 'CPP-MASTER', duration: 4, durationUnit: 'months', fee: 0, description: 'Programming Fundamentals, C Foundation, Transition to C++, OOPs Concepts' },
    { name: 'Python Programming Master', code: 'PY-MASTER', duration: 6, durationUnit: 'months', fee: 0, description: 'Python Fundamentals, Data Structures, Modules, Exception Handling, OOPs, Libraries (Numpy, Pandas)' },
    { name: 'MySQL Database Master', code: 'SQL-MASTER', duration: 3, durationUnit: 'months', fee: 0, description: 'DB Fundamentals, Queries, Joins, Constraints, Advanced SQL, DB Design, AI for SQL' },
    { name: 'Full Stack Coding Foundation', code: 'FULLSTACK', duration: 12, durationUnit: 'months', fee: 0, description: 'C, C++, Python, MySQL, Python + MySQL Integration, AI Assisted Coding, Projects' },
    { name: 'Young Coders AI Program - Level I', code: 'KIDS-AI-1', duration: 3, durationUnit: 'months', fee: 0, description: 'Computer Basics, Block Coding (Scratch), Simple Games, Intro to AI for Kids' },
    { name: 'Young Coders AI Program - Level II', code: 'KIDS-AI-2', duration: 3, durationUnit: 'months', fee: 0, description: 'Advanced Logic, Python for Kids, Game Dev, AI Tools, Mini App Projects' },
    { name: 'Professional Typing Master', code: 'TYPING', duration: 1, durationUnit: 'months', fee: 0, description: 'English Typing, Speed Typing Modules' },
  ];

  for (const course of courses) {
    await prisma.course.create({
      data: course,
    });
  }

  console.log('✅ New courses created');

  // 3. Create Batches for new courses
  const allCourses = await prisma.course.findMany();
  for (const course of allCourses) {
    const morningBatchName = `${course.code} - Morning Batch`;
    const eveningBatchName = `${course.code} - Evening Batch`;

    await prisma.batch.create({
      data: {
        name: morningBatchName,
        courseId: course.id,
        startDate: '2026-04-01',
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
        startDate: '2026-04-01',
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
