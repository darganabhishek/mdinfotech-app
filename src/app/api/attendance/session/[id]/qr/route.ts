import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TOTP } from 'otplib';
import QRCode from 'qrcode';

// Configure TOTP: 30-second window
const totp = new TOTP({ step: 30, window: 1 });

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

    // Generate TOTP token from the session secret
    const token = totp.generate(session.qrSecret);

    // QR payload: JSON with session ID + token + timestamp
    const qrPayload = JSON.stringify({
      sid: session.id,
      tok: token,
      ts: Math.floor(Date.now() / 1000),
    });

    // Generate QR as data URL
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    // Calculate seconds until next QR rotation
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
