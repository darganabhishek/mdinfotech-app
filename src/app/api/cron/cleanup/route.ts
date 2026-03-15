import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  // Simple auth: check for a secret header to prevent public triggers
  const authHeader = req.headers.get('x-cleanup-secret');
  if (process.env.CLEANUP_SECRET && authHeader !== process.env.CLEANUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results: any = {};

    // 1. Retention for Faculty/Staff Logs (60 days)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    
    const deletedFacultyLogs = await prisma.facultyClockLog.deleteMany({
      where: { clockIn: { lt: twoMonthsAgo } }
    });
    results.facultyLogsDeleted = deletedFacultyLogs.count;

    // 2. Retention for Student Attendance (Course completion + 15 days)
    // We only delete attendance for students whose course status is 'completed' 
    // AND it has been 15 days since the last attendance or current date.
    // Simplifying: If course is completed, delete their attendance after 15 days.
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const completedStudents = await prisma.student.findMany({
      where: { status: 'completed' },
      select: { id: true }
    });
    const completedStudentIds = completedStudents.map(s => s.id);

    if (completedStudentIds.length > 0) {
      const deletedStudentAttendance = await prisma.attendance.deleteMany({
        where: {
          studentId: { in: completedStudentIds },
          createdAt: { lt: fifteenDaysAgo }
        }
      });
      results.studentAttendanceDeleted = deletedStudentAttendance.count;
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
