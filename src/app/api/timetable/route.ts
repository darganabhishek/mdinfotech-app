import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const facultyId = searchParams.get('facultyId');

  try {
    const where: any = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (facultyId) where.facultyId = parseInt(facultyId);

    const slots = await prisma.timetableSlot.findMany({
      where,
      include: {
        batch: { include: { course: true } },
        faculty: { select: { name: true } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const slot = await prisma.timetableSlot.create({
      data: {
        day: body.day,
        startTime: body.startTime,
        endTime: body.endTime,
        subject: body.subject,
        room: body.room || '',
        batchId: parseInt(body.batchId),
        facultyId: parseInt(body.facultyId),
      },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Time slot conflict! Faculty or batch already scheduled at this time.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.timetableSlot.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 });
  }
}
