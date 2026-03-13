import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const userId = parseInt(session.user.id);

    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) return NextResponse.json({ error: 'Not a faculty member' }, { status: 400 });

    if (body.action === 'clock-in') {
      // Check for unclosed sessions
      const openLog = await prisma.facultyClockLog.findFirst({
        where: { facultyId: faculty.id, clockOut: null },
      });
      if (openLog) {
        return NextResponse.json({ error: 'You already have an open clock-in. Please clock out first.' }, { status: 400 });
      }

      const log = await prisma.facultyClockLog.create({
        data: {
          facultyId: faculty.id,
          clockIn: new Date(),
          latitude: body.latitude || null,
          longitude: body.longitude || null,
        },
      });
      return NextResponse.json({ success: true, message: 'Clocked in!', log });
    }

    if (body.action === 'clock-out') {
      const openLog = await prisma.facultyClockLog.findFirst({
        where: { facultyId: faculty.id, clockOut: null },
        orderBy: { clockIn: 'desc' },
      });
      if (!openLog) {
        return NextResponse.json({ error: 'No open clock-in found' }, { status: 400 });
      }

      const clockOut = new Date();
      const totalHours = (clockOut.getTime() - openLog.clockIn.getTime()) / (1000 * 60 * 60);

      const log = await prisma.facultyClockLog.update({
        where: { id: openLog.id },
        data: { clockOut, totalHours: Math.round(totalHours * 100) / 100 },
      });
      return NextResponse.json({ success: true, message: `Clocked out! Total hours: ${log.totalHours}`, log });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Clock operation failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get('facultyId');

  try {
    const where: any = {};
    if (facultyId) where.facultyId = parseInt(facultyId);

    const logs = await prisma.facultyClockLog.findMany({
      where,
      include: { faculty: { select: { name: true } } },
      orderBy: { clockIn: 'desc' },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
