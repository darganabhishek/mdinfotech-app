import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatStudentData, formatFacultyData } from '@/lib/utils';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const userRole = (session.user as any).role || 'staff';
  const userPermissions = (session.user as any).permissions || [];

  const isFaculty = userRole === 'faculty' || userPermissions.includes('faculty_portal');
  const isStudent = userRole === 'student' || userPermissions.includes('student_portal');
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canViewFinances = isAdmin;

  try {
    if (isStudent && !isAdmin) {
      // Student specific dashboard data
      const student = await prisma.student.findUnique({ 
        where: { userId },
        include: { 
          admissions: {
            where: { status: 'active' },
            include: { course: true, batch: { include: { timeSlot: true } }, payments: true }
          }
        }
      });

      if (!student) {
        return NextResponse.json({ isStudent: true, activeAdmissions: 0, totalPaid: 0, pendingFees: 0, courses: [] });
      }

      let totalPaid = 0;
      let totalNetFee = 0;
      
      const courses = student.admissions.map(adm => {
        const paid = adm.payments.reduce((s, p) => s + p.amount, 0);
        totalPaid += paid;
        totalNetFee += adm.netFee;
        return {
          id: adm.id,
          name: adm.course?.name,
          code: adm.course?.code,
          batch: adm.batch?.name,
          timing: adm.batch?.timeSlot?.label,
          paid,
          balance: Math.max(0, adm.netFee - paid),
          status: adm.status
        };
      });

      // Get latest notices for student
      const recentNotices = await prisma.notice.findMany({
        where: { 
          OR: [
            { target: 'all' },
            { target: 'student', studentId: student.id },
            { target: 'course', courseId: { in: student.admissions.map(a => a.courseId) } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      // Get attendance summary
      const attendanceSummary = await prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: { status: true }
      });

      const attCounts = {
        present: attendanceSummary.find(s => s.status === 'present')?._count.status || 0,
        late: attendanceSummary.find(s => s.status === 'late')?._count.status || 0,
        absent: attendanceSummary.find(s => s.status === 'absent')?._count.status || 0,
        total: attendanceSummary.reduce((sum, s) => sum + s._count.status, 0)
      };

      return NextResponse.json({
        isStudent: true,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        activeAdmissions: student.admissions.length,
        totalPaid,
        pendingFees: Math.max(0, totalNetFee - totalPaid),
        courses,
        recentNotices,
        attendance: attCounts
      });
    }

    if (isFaculty && !isAdmin) {
      // Faculty specific dashboard data
      const faculty = await prisma.faculty.findUnique({ where: { userId } });
      
      if (!faculty) {
        return NextResponse.json({
          isFaculty: true,
          totalStudents: 0,
          myBatches: 0,
          todaysClasses: [],
        });
      }

      const activeBatches = await prisma.batch.findMany({
        where: { facultyId: faculty.id, status: 'active' },
        include: { course: true, timeSlot: true }
      });

      const myStudents = await prisma.admission.count({ 
        where: { batch: { facultyId: faculty.id }, status: 'active' } 
      });

      // Filter batches occurring today (simplified check if timeSlot is set)
      const todaysClasses = activeBatches.filter(b => b.timeSlot);

      // Get latest notices for faculty
      const recentNotices = await prisma.notice.findMany({
        where: { 
          OR: [
            { target: 'all' },
            { target: 'faculty' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return NextResponse.json({
        isFaculty: true,
        totalStudents: myStudents,
        myBatches: activeBatches.length,
        todaysClasses,
        activeBatches,
        recentNotices
      });
    }

    // Admin / Staff / Finance dashboard data
    const [totalStudents, activeAdmissions, totalCourses, totalEnquiries, payments, admissions, recentPayments, recentAdmissions, recentNotices] = await Promise.all([
      prisma.student.count(),
      prisma.admission.count({ where: { status: 'active' } }),
      prisma.course.count({ where: { active: true } }),
      prisma.enquiry.count(),
      canViewFinances ? prisma.payment.findMany({ select: { amount: true } }) : Promise.resolve([]),
      canViewFinances ? prisma.admission.findMany({ select: { netFee: true, status: true, payments: { select: { amount: true } } } }) : Promise.resolve([]),
      canViewFinances ? prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { admission: { include: { student: true } } } }) : Promise.resolve([]),
      prisma.admission.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { student: true, course: true } }),
      prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    let totalRevenue = 0;
    let pendingFees = 0;
    let revenueTrend: any[] = [];

    if (canViewFinances) {
      totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

      for (const adm of admissions) {
        const paid = adm.payments.reduce((s: number, p: any) => s + p.amount, 0);
        pendingFees += Math.max(0, adm.netFee - paid);
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      
      const monthlyPayments = await prisma.payment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, createdAt: true }
      });

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      revenueTrend = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const monthName = months[d.getMonth()];
        const year = d.getFullYear();
        const amount = monthlyPayments
          .filter(p => new Date(p.createdAt).getMonth() === d.getMonth() && new Date(p.createdAt).getFullYear() === d.getFullYear())
          .reduce((sum, p) => sum + p.amount, 0);
        return { month: `${monthName} ${year}`, amount };
      });
    }

    const courseStats = await prisma.course.findMany({
      where: { active: true },
      include: { _count: { select: { admissions: true } } },
    });

    // Format recent data for display
    const formattedPayments = recentPayments.map((p: any) => ({
      ...p,
      admission: p.admission ? {
        ...p.admission,
        student: formatStudentData(p.admission.student)
      } : null
    }));

    const formattedAdmissions = recentAdmissions.map((a: any) => ({
      ...a,
      student: formatStudentData(a.student)
    }));

    return NextResponse.json({
      isFaculty: false,
      totalStudents,
      activeAdmissions,
      totalRevenue,
      pendingFees,
      totalCourses,
      totalEnquiries,
      recentPayments: formattedPayments,
      recentAdmissions: formattedAdmissions,
      courseStats: canViewFinances ? courseStats.map((c: any) => ({ name: c.code, count: c._count.admissions })) : [],
      revenueTrend,
      canViewFinances,
      recentNotices
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
