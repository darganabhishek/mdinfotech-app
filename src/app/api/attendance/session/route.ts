import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

// Create a new class session with rotating QR
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const userId = parseInt(session.user.id);
    const userRole = (session.user as any).role;
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    
    // Authorization: Allow faculty, admin, or superadmin
    if (!faculty && userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Only faculty or administrators can start sessions' }, { status: 403 });
    }

    const qrSecret = crypto.randomBytes(32).toString('hex');
    const timeSlotId = body.timeSlotId ? parseInt(body.timeSlotId) : null;
    const batchId = body.batchId ? parseInt(body.batchId) : null;

    if (!timeSlotId && !batchId) {
      return NextResponse.json({ error: 'Either timeSlotId or batchId is required' }, { status: 400 });
    }

    // Verify time slot exists if provided
    if (timeSlotId) {
      const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!timeSlot) return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });

      // Time-slot validation
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = timeSlot.startTime.split(':').map(Number);
      const [endH, endM] = timeSlot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes < startMinutes - 15 || currentMinutes > endMinutes + 15) {
        return NextResponse.json({ 
          error: `Access Denied: Scheduled for ${timeSlot.startTime} - ${timeSlot.endTime}.` 
        }, { status: 400 });
      }

      // Close existing sessions for this time slot (for current creator)
      await (prisma.attendanceSession as any).updateMany({
        where: { timeSlotId, creatorId: userId, active: true },
        data: { active: false, endTime: new Date() },
      });
    }

    const attendanceSession = await (prisma.attendanceSession as any).create({
      data: {
        timeSlotId,
        batchId,
        facultyId: faculty?.id || null,
        creatorId: userId,
        qrSecret,
        latitude: parseFloat(body.latitude) || 0,
        longitude: parseFloat(body.longitude) || 0,
        radius: parseInt(body.radius) || 100,
      },
      include: { 
        batch: { include: { course: true } },
        timeSlot: true
      },
    });

    return NextResponse.json(attendanceSession, { status: 201 });
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// Get active sessions or session list
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const timeSlotId = searchParams.get('timeSlotId');
  const batchId = searchParams.get('batchId');
  const active = searchParams.get('active');

  try {
    const where: any = {};
    if (timeSlotId) where.timeSlotId = parseInt(timeSlotId);
    if (batchId) where.batchId = parseInt(batchId);
    if (active === 'true') where.active = true;

    const sessions = await (prisma.attendanceSession as any).findMany({
      where,
      include: {
        batch: { include: { course: true } },
        timeSlot: true,
        faculty: { select: { name: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
