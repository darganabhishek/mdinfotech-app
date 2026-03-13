import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { 
        course: true, 
        _count: { select: { admissions: true } },
        admissions: {
          include: { student: { select: { id: true, name: true, enrollmentNo: true } } }
        }
      }
    });
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    return NextResponse.json(batch);
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
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...body,
        courseId: body.courseId ? Number(body.courseId) : undefined,
        capacity: body.capacity ? Number(body.capacity) : undefined,
      }
    });
    return NextResponse.json(batch);
  } catch (error) {
    console.error('Update batch error:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    // Instead of deleting, we might want to deactivate, but based on schema,
    // we'll just update status to 'completed' or similar if it has admissions,
    // or delete if empty. For simplicity, we'll allow deletion.
    await prisma.batch.delete({ where: { id } });
    return NextResponse.json({ message: 'Batch deleted' });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json({ error: 'Failed to delete batch (check if it has admissions)' }, { status: 500 });
  }
}
