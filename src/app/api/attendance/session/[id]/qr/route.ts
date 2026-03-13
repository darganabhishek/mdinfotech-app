import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import QRCode from 'qrcode';

function generateToken(secret: string): string {
  const timeSlot = Math.floor(Date.now() / 30000); // 30-second slots
  return crypto.createHmac('sha256', secret).update(String(timeSlot)).digest('hex').substring(0, 8);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const sessionId = parseInt(idStr);

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { course: true } }, _count: { select: { attendances: true } } },
    });

    if (!session || !session.active) {
      return NextResponse.json({ error: 'Session not found or inactive' }, { status: 404 });
    }

    const token = generateToken(session.qrSecret);

    const qrPayload = JSON.stringify({
      sid: session.id,
      tok: token,
      ts: Math.floor(Date.now() / 1000),
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = 30 - (now % 30);

    return NextResponse.json({
      qr: qrDataUrl,
      secondsLeft,
      token,
      attendanceCount: session._count.attendances,
      batchName: `${session.batch.course.name} - ${session.batch.name}`,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
