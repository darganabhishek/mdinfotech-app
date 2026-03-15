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

    const [students, courses, timeSlots] = await Promise.all([
      prisma.student.findMany(),
      prisma.course.findMany(),
      prisma.timeSlot.findMany(),
    ]);

    for (const item of data) {
      if (item.EnrollmentNo === 'EnrollmentNo' || !item.EnrollmentNo) continue; // skip header or empty row
      try {
        if (!item.CourseCode || !item.TimeSlot) {
          throw new Error('Missing required fields (CourseCode, TimeSlot)');
        }

        const student = students.find(s => s.enrollmentNo === item.EnrollmentNo);
        if (!student) throw new Error(`Student not found: ${item.EnrollmentNo}`);

        const course = courses.find(c => c.code === item.CourseCode);
        if (!course) throw new Error(`Course not found: ${item.CourseCode}`);

        const timeSlot = timeSlots.find(t => t.label === item.TimeSlot);
        if (!timeSlot) throw new Error(`TimeSlot not found: ${item.TimeSlot}`);

        let targetBatchId = null;
        let batch = await prisma.batch.findFirst({
          where: { courseId: course.id, timeSlotId: timeSlot.id },
          include: { _count: { select: { admissions: { where: { status: 'active' } } } } }
        });

        if (batch) {
          if (batch._count.admissions >= 20) {
            throw new Error(`Batch Full for ${course.name} at ${timeSlot.label}`);
          }
          targetBatchId = batch.id;
        } else {
          batch = await prisma.batch.create({
            data: {
              name: `${course.name} Batch`,
              courseId: course.id,
              timeSlotId: timeSlot.id,
              capacity: 20,
              timing: timeSlot.label,
              status: 'active'
            },
            include: { _count: { select: { admissions: true } } }
          });
          targetBatchId = batch.id;
        }

        const discount = parseFloat(item.Discount) || 0;
        const totalFee = course.fee || 0;
        const netFee = totalFee - discount;

        await prisma.admission.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            batchId: targetBatchId,
            admissionDate: item.AdmissionDate || new Date().toISOString().split('T')[0],
            totalFee,
            discount,
            netFee,
            paymentPlan: item.PaymentPlan || 'monthly',
            installmentAmount: item.InstallmentAmount ? Number(item.InstallmentAmount) : null,
            installmentsCount: item.InstallmentsCount ? Number(item.InstallmentsCount) : null,
            status: item.Status || 'active',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
