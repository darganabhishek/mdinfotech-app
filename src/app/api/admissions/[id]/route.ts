import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { student: true, course: true, batch: true, payments: true }
    });
    if (!admission) return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
    return NextResponse.json(admission);
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    
    // Recalculate netFee if course or discount changed
    let updatedData: any = { ...body };
    if (body.courseId || body.discount !== undefined) {
      const courseId = body.courseId ? Number(body.courseId) : undefined;
      const discount = body.discount !== undefined ? Number(body.discount) : undefined;
      
      const currentAdm = await prisma.admission.findUnique({ where: { id } });
      const finalCourseId = courseId || currentAdm?.courseId;
      const finalDiscount = discount !== undefined ? discount : currentAdm?.discount || 0;
      
      const course = await prisma.course.findUnique({ where: { id: finalCourseId } });
      const totalFee = course?.fee || 0;
      updatedData.totalFee = totalFee;
      updatedData.discount = finalDiscount;
      updatedData.netFee = totalFee - finalDiscount;
    }
    
    if (body.paymentPlan !== undefined) {
      updatedData.paymentPlan = body.paymentPlan;
      updatedData.installmentAmount = body.installmentAmount ? Number(body.installmentAmount) : null;
      updatedData.installmentsCount = body.installmentsCount ? Number(body.installmentsCount) : null;
    }

    let targetBatchId = body.batchId ? Number(body.batchId) : undefined;
    const finalCourseId = body.courseId ? Number(body.courseId) : (await prisma.admission.findUnique({ where: { id } }))?.courseId;

    if (body.timeSlotId && finalCourseId) {
      const timeSlotId = parseInt(body.timeSlotId);
      const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!timeSlot) return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });

      let batch = await prisma.batch.findFirst({
        where: { courseId: finalCourseId, timeSlotId },
        include: { _count: { select: { admissions: { where: { status: 'active' } } } } }
      });

      if (batch) {
        if (body.status === 'active' && batch._count.admissions >= 20) {
          const currentAdm = await prisma.admission.findUnique({ where: { id } });
          if (currentAdm?.batchId !== batch.id) {
            return NextResponse.json({ error: 'Batch Full — Please choose another time slot.' }, { status: 400 });
          }
        }
        targetBatchId = batch.id;
      } else {
        const course = await prisma.course.findUnique({ where: { id: finalCourseId } });
        batch = await prisma.batch.create({
          data: {
            name: `${course?.name || 'Course'} Batch`,
            courseId: finalCourseId,
            timeSlotId,
            capacity: 20,
            timing: timeSlot.label,
            status: 'active'
          },
          include: { _count: { select: { admissions: true } } }
        });
        targetBatchId = batch.id;
      }
    }

    const admission = await prisma.admission.update({
      where: { id },
      data: {
        ...updatedData,
        studentId: body.studentId ? Number(body.studentId) : undefined,
        courseId: body.courseId ? Number(body.courseId) : undefined,
        batchId: targetBatchId,
      }
    });
    return NextResponse.json(admission);
  } catch (error) {
    console.error('Update admission error:', error);
    return NextResponse.json({ error: 'Failed to update admission' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.admission.delete({ where: { id } });
    return NextResponse.json({ message: 'Admission deleted' });
  } catch (error) {
    console.error('Delete admission error:', error);
    return NextResponse.json({ error: 'Failed to delete admission (check if it has payments)' }, { status: 500 });
  }
}
