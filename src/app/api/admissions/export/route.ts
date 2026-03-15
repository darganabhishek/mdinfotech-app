import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const admissions = await prisma.admission.findMany({
      include: {
        student: true,
        course: true,
        batch: { include: { timeSlot: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'EnrollmentNo', 'StudentName', 'CourseCode', 'TimeSlot', 
      'AdmissionDate', 'NetFee', 'Discount', 'Status', 'PaymentPlan', 'Notes'
    ];

    const rows = admissions.map((a: any) => [
      a.student?.enrollmentNo || '',
      `"${a.student?.name || ''}"`,
      a.course?.code || '',
      a.batch?.timeSlot?.label || a.batch?.timing || '',
      a.admissionDate ? new Date(a.admissionDate).toISOString().split('T')[0] : '',
      a.netFee || 0,
      a.discount || 0,
      a.status || '',
      a.paymentPlan || '',
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvData = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="admissions_export.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Error exporting admissions' }, { status: 500 });
  }
}
