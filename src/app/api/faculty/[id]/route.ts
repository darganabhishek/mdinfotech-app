import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const faculty = await prisma.faculty.update({
      where: { id: parseInt(params.id) },
      data
    });
    return NextResponse.json(faculty);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update faculty' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    
    // Check for associated batches
    const batches = await prisma.batch.count({ where: { facultyId: id } });
    if (batches > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete faculty assigned to active batches.' 
      }, { status: 400 });
    }

    await prisma.faculty.delete({ where: { id } });
    return NextResponse.json({ message: 'Faculty deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete faculty' }, { status: 500 });
  }
}
