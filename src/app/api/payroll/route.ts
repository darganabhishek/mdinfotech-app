import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const faculty = await prisma.faculty.findMany({
      where: { active: true },
      select: {
        id: true, name: true, salary: true, specialization: true, joiningDate: true, email: true, phone: true,
        batches: { select: { id: true, name: true, course: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    const totalMonthlySalary = faculty.reduce((sum, f) => sum + f.salary, 0);
    const totalAnnualSalary = totalMonthlySalary * 12;

    return NextResponse.json({
      faculty,
      summary: {
        totalFaculty: faculty.length,
        totalMonthlySalary,
        totalAnnualSalary,
        avgSalary: faculty.length ? Math.round(totalMonthlySalary / faculty.length) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payroll data' }, { status: 500 });
  }
}
