import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { data } = await req.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    let count = 0;
    const errors: string[] = [];

    const [students, courses, admissions] = await Promise.all([
      prisma.student.findMany(),
      prisma.course.findMany(),
      prisma.admission.findMany({ where: { status: 'active' } })
    ]);

    // Pre-calculate count for receipt generation
    let currentReceiptCount = await prisma.payment.count();

    for (const item of data) {
      if (item.EnrollmentNo === 'EnrollmentNo' || !item.EnrollmentNo) continue; // skip header or empty row
      try {
        if (!item.CourseCode || !item.Amount) {
          throw new Error('Missing required fields (CourseCode, Amount)');
        }

        const student = students.find(s => s.enrollmentNo === item.EnrollmentNo);
        if (!student) throw new Error(`Student not found: ${item.EnrollmentNo}`);

        const course = courses.find(c => c.code === item.CourseCode);
        if (!course) throw new Error(`Course not found: ${item.CourseCode}`);

        const admission = admissions.find(a => a.studentId === student.id && a.courseId === course.id);
        if (!admission) throw new Error(`Active admission not found for student ${item.EnrollmentNo} and course ${item.CourseCode}`);

        const receiptNo = `RCP${new Date().getFullYear()}${String(currentReceiptCount + 1).padStart(5, '0')}`;
        currentReceiptCount++;

        await prisma.payment.create({
          data: {
            admissionId: admission.id,
            amount: Number(item.Amount),
            paymentDate: item.PaymentDate || new Date().toISOString().split('T')[0],
            paymentMode: item.PaymentMode || 'cash',
            receiptNo,
            reference: item.Reference || '',
            notes: item.Notes || '',
          }
        });
        count++;
      } catch (e: any) {
        errors.push(`Row (${item.EnrollmentNo}): ${e.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count, 
      failed: errors.length,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
