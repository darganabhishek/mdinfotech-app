const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin@123', 12);

  // 0. Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  console.log('🗑️  Cleared existing DB');

  // 1. Create Permissions
  const permissionsData = [
    { name: 'manage_students', description: 'Create, edit, and delete students' },
    { name: 'manage_courses', description: 'Create and edit courses' },
    { name: 'manage_batches', description: 'Manage schedules and batches' },
    { name: 'manage_admissions', description: 'Handle new admissions' },
    { name: 'manage_payments', description: 'Record and view payments' },
    { name: 'view_reports', description: 'Access financial and academic reports' },
    { name: 'manage_exams', description: 'Create and grade assignments/exams' },
    { name: 'manage_users', description: 'Manage staff accounts and permissions' },
    { name: 'manage_settings', description: 'Update institute profile' },
    { name: 'student_portal', description: 'Access basic student features' },
    { name: 'teacher_portal', description: 'Access teacher features' },
  ];

  const permissions = {};
  for (const p of permissionsData) {
    permissions[p.name] = await prisma.permission.create({ data: p });
  }
  console.log('✅ Permissions created');

  // 2. Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'superadmin',
      description: 'Full system access',
      permissions: { connect: Object.values(permissions).map(p => ({ id: p.id })) }
    }
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'staff',
      description: 'Manage admissions and payments',
      permissions: { 
        connect: [
          'manage_students', 'manage_batches', 'manage_admissions', 'manage_payments', 'view_reports'
        ].map(name => ({ id: permissions[name].id }))
      }
    }
  });

  const teacherRole = await prisma.role.create({
    data: {
      name: 'teacher',
      description: 'Manage classes and exams',
      permissions: { 
        connect: [
          'teacher_portal', 'manage_exams', 'view_reports'
        ].map(name => ({ id: permissions[name].id }))
      }
    }
  });

  const studentRole = await prisma.role.create({
    data: {
      name: 'student',
      description: 'Access student portal',
      permissions: { 
        connect: [{ id: permissions['student_portal'].id }]
      }
    }
  });
  console.log('✅ Roles created');

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      username: 'admin',
      password: hashedPassword,
      roleId: adminRole.id,
      active: true,
    },
  });

  const sampleStaff = await prisma.user.create({
    data: {
      name: 'Office Staff',
      username: 'staff',
      password: hashedPassword,
      roleId: staffRole.id,
      active: true,
    },
  });
  console.log('✅ Admin and Staff users created');

  // 4. Create New Courses from Flyers
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

  // 5. Create Faculty
  const facultyData = [
    { name: 'Dr. John Smith', specialization: 'Computer Fundamentals & MS Office', email: 'john@mdinfotech.com' },
    { name: 'Ms. Sarah Connor', specialization: 'Tally & Accounting', email: 'sarah@mdinfotech.com' },
    { name: 'Mr. Alex Rivers', specialization: 'Python & Web Development', email: 'alex@mdinfotech.com' },
  ];

  const faculty = [];
  for (const f of facultyData) {
    faculty.push(await prisma.faculty.create({ data: f }));
  }
  console.log('✅ Faculty created');

  // 6. Create Batches
  const allCourses = await prisma.course.findMany();
  for (let i = 0; i < allCourses.length; i++) {
    const course = allCourses[i];
    const morningBatchName = `${course.code} - Morning Batch`;
    const eveningBatchName = `${course.code} - Evening Batch`;
    
    // Assign faculty in rotation
    const faculty1 = faculty[i % faculty.length].id;
    const faculty2 = faculty[(i + 1) % faculty.length].id;

    await prisma.batch.create({
      data: {
        name: morningBatchName,
        courseId: course.id,
        startDate: '2026-04-01',
        timing: '10:00 AM - 12:00 PM',
        facultyId: faculty1,
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
        facultyId: faculty2,
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
