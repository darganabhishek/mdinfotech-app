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

    const admission = await prisma.admission.update({
      where: { id },
      data: {
        ...updatedData,
        studentId: body.studentId ? Number(body.studentId) : undefined,
        courseId: body.courseId ? Number(body.courseId) : undefined,
        batchId: body.batchId ? Number(body.batchId) : undefined,
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
