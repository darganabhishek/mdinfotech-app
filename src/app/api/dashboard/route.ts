import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [totalStudents, activeAdmissions, totalCourses, totalEnquiries, payments, admissions, recentPayments, recentAdmissions] = await Promise.all([
      prisma.student.count(),
      prisma.admission.count({ where: { status: 'active' } }),
      prisma.course.count({ where: { active: true } }),
      prisma.enquiry.count(),
      prisma.payment.findMany({ select: { amount: true } }),
      prisma.admission.findMany({ select: { netFee: true, status: true, payments: { select: { amount: true } } } }),
      prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { admission: { include: { student: true } } } }),
      prisma.admission.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { student: true, course: true } }),
    ]);

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Calculate pending fees
    let pendingFees = 0;
    for (const adm of admissions) {
      const paid = adm.payments.reduce((s: number, p: any) => s + p.amount, 0);
      pendingFees += Math.max(0, adm.netFee - paid);
    }

    // Course-wise stats
    const courseStats = await prisma.course.findMany({
      where: { active: true },
      include: { _count: { select: { admissions: true } } },
    });

    // Monthly Revenue Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const monthlyPayments = await prisma.payment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true }
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueTrend = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      const amount = monthlyPayments
        .filter(p => new Date(p.createdAt).getMonth() === d.getMonth() && new Date(p.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, p) => sum + p.amount, 0);
      return { month: `${monthName} ${year}`, amount };
    });

    return NextResponse.json({
      totalStudents,
      activeAdmissions,
      totalRevenue,
      pendingFees,
      totalCourses,
      totalEnquiries,
      recentPayments,
      recentAdmissions,
      courseStats: courseStats.map((c: any) => ({ name: c.code, count: c._count.admissions })),
      revenueTrend
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
