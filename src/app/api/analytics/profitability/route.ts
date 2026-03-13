import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        admissions: { include: { payments: true } },
        batches: { include: { _count: { select: { admissions: true } } } },
      },
    });

    const profitability = courses.map(course => {
      const totalStudents = course.admissions.length;
      const totalRevenue = course.admissions.reduce((sum, a) =>
        sum + a.payments.reduce((s, p) => s + p.amount, 0), 0
      );
      const totalFeeExpected = course.admissions.reduce((sum, a) => sum + a.netFee, 0);
      const collectionRate = totalFeeExpected > 0 ? Math.round((totalRevenue / totalFeeExpected) * 100) : 0;

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        fee: course.fee,
        totalStudents,
        totalRevenue,
        totalFeeExpected,
        collectionRate,
        activeBatches: course.batches.filter(b => b.status === 'active').length,
      };
    });

    const totalRevenue = profitability.reduce((s, c) => s + c.totalRevenue, 0);
    const totalExpected = profitability.reduce((s, c) => s + c.totalFeeExpected, 0);

    return NextResponse.json({
      courses: profitability.sort((a, b) => b.totalRevenue - a.totalRevenue),
      summary: { totalRevenue, totalExpected, overallCollectionRate: totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0 },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
