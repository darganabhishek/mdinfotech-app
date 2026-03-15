import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        admission: {
          include: { student: true, course: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ReceiptNo', 'EnrollmentNo', 'StudentName', 'CourseCode', 
      'Amount', 'PaymentMode', 'PaymentDate', 'Reference', 'Notes'
    ];

    const rows = payments.map((p: any) => [
      p.receiptNo || '',
      p.admission?.student?.enrollmentNo || '',
      `"${p.admission?.student?.name || ''}"`,
      p.admission?.course?.code || '',
      p.amount || 0,
      p.paymentMode || '',
      p.paymentDate || '',
      `"${(p.reference || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvData = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="payments_export.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Error exporting payments' }, { status: 500 });
  }
}
