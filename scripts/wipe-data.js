const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting institute data wipe (Dummy data removal)...');

  try {
    // 1. Delete Attendance & Sessions
    const attendanceCount = await prisma.attendance.deleteMany({});
    const sessionCount = await prisma.attendanceSession.deleteMany({});
    console.log(`- Deleted ${attendanceCount.count} attendance records and ${sessionCount.count} sessions.`);

    // 2. Delete Fee Records
    const feeCount = await prisma.feeRecord.deleteMany({});
    console.log(`- Deleted ${feeCount.count} fee records.`);

    // 3. Delete Students (Keep structure)
    const studentCount = await prisma.student.deleteMany({});
    console.log(`- Deleted ${studentCount.count} students.`);

    // 4. Delete Admissions
    const admissionCount = await prisma.admission.deleteMany({});
    console.log(`- Deleted ${admissionCount.count} admission records.`);

    // 5. Delete Faculty Clock Logs
    const clockLogCount = await prisma.facultyClockLog.deleteMany({});
    console.log(`- Deleted ${clockLogCount.count} faculty/staff clock logs.`);

    // 6. Delete User Accounts (Optional - maybe keep Admin, but the user mentioned Faculty as User accounts)
    // Actually, I'll delete users with role 'student' or 'faculty' if we want a TRULY clean start.
    // The user said: "Faculty can only be choosen from the list of User Accounts".
    // I'll keep the Faculty profiles if they are linked to real user accounts, 
    // but the user said "Remove all dummy data". 
    // I'll delete all students and admissions for sure.
    // I will NOT delete faculty profiles unless they are clearly dummy. I'll leave them for now unless asked.
    
    console.log('\n✨ Data wipe complete. All academic and attendance data has been reset.');
  } catch (error) {
    console.error('❌ Error during data wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
