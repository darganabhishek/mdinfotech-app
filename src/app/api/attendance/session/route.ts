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
    const qrSecret = crypto.randomBytes(32).toString('hex');

    // Close any existing active sessions for this batch
    await prisma.attendanceSession.updateMany({
      where: { batchId: parseInt(body.batchId), active: true },
      data: { active: false, endTime: new Date() },
    });

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        batchId: parseInt(body.batchId),
        facultyId: parseInt(body.facultyId),
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
