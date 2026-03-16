import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const studentId = parseInt(params.id);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        admissions: {
          include: {
            course: true,
            batch: true,
            payments: true,
          }
        },
        attendances: true,
        submissions: {
          include: {
            assignment: {
              include: { topic: true }
            }
          }
        }
      }
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Calculate overall stats
    const totalPaid = (student.admissions as any[]).reduce((sum: number, a: any) => 
      sum + (a.payments as any[]).reduce((s: number, p: any) => s + p.amount, 0), 0
    );
    const totalFee = (student.admissions as any[]).reduce((sum: number, a: any) => sum + a.netFee, 0);
    const balanceDue = totalFee - totalPaid;

    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter((a: any) => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Enhance admissions with progress (simulated based on assignments/topics for now)
    const enhancedAdmissions = (student.admissions as any[]).map((adm: any) => {
      // In a real app, progress might be tracked in the DB or calculated via topics covered
      return {
        ...adm,
        progress: Math.floor(Math.random() * 101) // Simulated progress
      };
    });

    return NextResponse.json({
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      phone: student.phone,
      totalPaid,
      balanceDue,
      attendancePercentage,
      admissions: enhancedAdmissions,
      submissions: student.submissions
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
