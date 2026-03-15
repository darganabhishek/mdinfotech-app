import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const userRole = (session.user as any).role || 'staff';
  const userPermissions = (session.user as any).permissions || [];

  const isFaculty = userRole === 'teacher' || userPermissions.includes('teacher_portal');
  const isAdmin = userRole === 'admin';
  const canViewFinances = isAdmin || userPermissions.includes('manage_payments');

  try {
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

      return NextResponse.json({
        isTeacher: true, // Keep key name for frontend compatibility if needed, but it's Faculty data
        totalStudents: myStudents,
        myBatches: activeBatches.length,
        todaysClasses,
        activeBatches
      });
    }

    // Admin / Staff / Finance dashboard data
    const [totalStudents, activeAdmissions, totalCourses, totalEnquiries, payments, admissions, recentPayments, recentAdmissions] = await Promise.all([
      prisma.student.count(),
      prisma.admission.count({ where: { status: 'active' } }),
      prisma.course.count({ where: { active: true } }),
      prisma.enquiry.count(),
      canViewFinances ? prisma.payment.findMany({ select: { amount: true } }) : Promise.resolve([]),
      canViewFinances ? prisma.admission.findMany({ select: { netFee: true, status: true, payments: { select: { amount: true } } } }) : Promise.resolve([]),
      canViewFinances ? prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { admission: { include: { student: true } } } }) : Promise.resolve([]),
      prisma.admission.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { student: true, course: true } }),
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

    return NextResponse.json({
      isTeacher: false,
      totalStudents,
      activeAdmissions,
      totalRevenue,
      pendingFees,
      totalCourses,
      totalEnquiries,
      recentPayments,
      recentAdmissions,
      courseStats: courseStats.map((c: any) => ({ name: c.code, count: c._count.admissions })),
      revenueTrend,
      canViewFinances
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
