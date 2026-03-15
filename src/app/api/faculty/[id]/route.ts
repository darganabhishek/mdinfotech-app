import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toTitleCase, formatFacultyData } from '@/lib/utils';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const data = await req.json();

    // Clean data for Title Case
    const updateData = { ...data };
    if (updateData.name) updateData.name = toTitleCase(updateData.name);
    if (updateData.qualification) updateData.qualification = toTitleCase(updateData.qualification);
    if (updateData.specialization) updateData.specialization = toTitleCase(updateData.specialization);

    const faculty = await prisma.faculty.update({
      where: { id: parseInt(idStr) },
      data: updateData
    });
    return NextResponse.json(formatFacultyData(faculty));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update faculty' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    // Unassign from any batches they are currently teaching
    await prisma.batch.updateMany({
      where: { facultyId: id },
      data: { facultyId: null }
    });

    try {
      // Try hard delete first
      await prisma.faculty.delete({ where: { id } });
      return NextResponse.json({ message: 'Faculty permanently deleted' });
    } catch (e: any) {
      // If foreign key constraint fails (they have past assignments, attendances, etc), do a soft delete
      await prisma.faculty.update({ where: { id }, data: { active: false } });
      return NextResponse.json({ message: 'Faculty deactivated (retained for historical records)' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete faculty' }, { status: 500 });
  }
}

