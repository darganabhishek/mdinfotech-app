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
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    
    if (!faculty) {
      return NextResponse.json({ error: 'Only faculty members can start sessions' }, { status: 403 });
    }

    const qrSecret = crypto.randomBytes(32).toString('hex');
    const batchId = parseInt(body.batchId);

    // Verify batch exists and check time slot
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { timeSlot: true }
    });

    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    // Time-slot validation (Simplified: check if current time is within slot)
    if (batch.timeSlot) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = batch.timeSlot.startTime.split(':').map(Number);
      const [endH, endM] = batch.timeSlot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      // Allow a 15-minute buffer before and after
      if (currentMinutes < startMinutes - 15 || currentMinutes > endMinutes + 15) {
        return NextResponse.json({ 
          error: `Access Denied: This batch is scheduled for ${batch.timeSlot.startTime} - ${batch.timeSlot.endTime}. Please start the session during your allotted time.` 
        }, { status: 400 });
      }
    }

    // Close any existing active sessions for this batch
    await prisma.attendanceSession.updateMany({
      where: { batchId, active: true },
      data: { active: false, endTime: new Date() },
    });

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        batchId,
        facultyId: faculty.id,
        qrSecret,
        latitude: parseFloat(body.latitude) || 0,
        longitude: parseFloat(body.longitude) || 0,
        radius: parseInt(body.radius) || 100,
      },
      include: { batch: { include: { course: true } } },
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
  const batchId = searchParams.get('batchId');
  const active = searchParams.get('active');

  try {
    const where: any = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (active === 'true') where.active = true;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        batch: { include: { course: true } },
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
