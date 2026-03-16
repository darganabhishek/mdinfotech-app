import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = parseInt(session.user.id);

    // Find student linked to this user
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        admissions: {
          include: {
            course: true,
            batch: true,
            payments: true,
          }
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
          include: { batch: { include: { course: true } } }
        }
      }
    });

    if (!student) {
      return NextResponse.json(null);
    }

    // Calculate stats
    const totalCourses = student.admissions.length;
    const totalPaid = student.admissions.reduce((sum, a) =>
      sum + a.payments.reduce((s, p) => s + p.amount, 0), 0
    );
    const totalFee = student.admissions.reduce((sum, a) => sum + a.netFee, 0);
    const balanceDue = totalFee - totalPaid;

    // Attendance stats
    const totalAttendance = await prisma.attendance.count({ where: { studentId: student.id } });
    const presentCount = await prisma.attendance.count({ where: { studentId: student.id, status: 'present' } });
    const lateCount = await prisma.attendance.count({ where: { studentId: student.id, status: 'late' } });
    const attendancePercent = totalAttendance > 0
      ? Math.round(((presentCount + lateCount) / totalAttendance) * 100)
      : 100;

    const courses = student.admissions.map(a => ({
      admissionId: a.id,
      courseId: a.courseId,
      name: a.course.name,
      batchName: a.batch?.name || 'Pending/No Batch',
      batchId: a.batch?.id,
      status: a.status,
      netFee: a.netFee,
      paid: a.payments.reduce((s, p) => s + p.amount, 0),
    }));

    const recentAttendance = student.attendances.map(att => ({
      date: att.date,
      batchName: att.batch?.name || '',
      status: att.status,
    }));

    // Fetch Notices
    const courseIds = student.admissions.map(a => a.courseId);
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { target: 'all' },
          { target: 'course', courseId: { in: courseIds } },
          { target: 'student', studentId: student.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch Job Posts
    const jobs = await prisma.jobPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch Assignments grouped by Course/Topic
    const batchIds = student.admissions.map(a => a.batchId).filter(id => id !== null) as number[];
    const assignments = await prisma.assignment.findMany({
      where: { batchId: { in: batchIds } },
      include: { topic: true, faculty: { select: { name: true } } },
      orderBy: [
        { topicId: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      totalCourses,
      attendancePercent,
      totalPaid,
      balanceDue,
      courses,
      recentAttendance,
      notices,
      jobs,
      assignments
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
