import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const faculty = await prisma.faculty.update({
      where: { id: parseInt(idStr) },
      data
    });
    return NextResponse.json(faculty);
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
    
    // First check if they have active batches
    const activeBatches = await prisma.batch.count({ 
      where: { facultyId: id, status: 'active' } 
    });
    
    if (activeBatches > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete faculty assigned to active batches. Reassign the batches first.' 
      }, { status: 400 });
    }

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

