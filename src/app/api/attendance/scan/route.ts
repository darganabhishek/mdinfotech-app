import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TOTP } from 'otplib';

const totp = new TOTP({ step: 30, window: 1 });

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  const userSession = await getServerSession(authOptions);
  if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { sessionId, token, latitude, longitude, deviceFingerprint } = body;
    const userId = parseInt(userSession.user.id);

    // 1. Find the active session
    const attSession = await prisma.attendanceSession.findUnique({
      where: { id: parseInt(sessionId) },
      include: { batch: { include: { admissions: { include: { student: true } } } } },
    });

    if (!attSession || !attSession.active) {
      return NextResponse.json({ error: 'Session is no longer active' }, { status: 400 });
    }

    // 2. Verify TOTP token
    const isValidToken = totp.check(token, attSession.qrSecret);
    if (!isValidToken) {
      await prisma.securityAlert.create({
        data: { userId, type: 'failed_attempt', message: 'Invalid QR code scanned', details: `Session ${sessionId}` },
      });
      return NextResponse.json({ error: 'Invalid or expired QR code. Please scan the latest QR.' }, { status: 400 });
    }

    // 3. GPS check
    if (attSession.latitude !== 0 && attSession.longitude !== 0 && latitude && longitude) {
      const distance = getDistanceMeters(attSession.latitude, attSession.longitude, latitude, longitude);
      if (distance > attSession.radius) {
        await prisma.securityAlert.create({
          data: { userId, type: 'outside_radius', message: `Student outside institute radius (${Math.round(distance)}m away)`, details: `lat:${latitude},lng:${longitude}` },
        });
        return NextResponse.json({ error: `You are ${Math.round(distance)}m away from the institute. Must be within ${attSession.radius}m.` }, { status: 400 });
      }
    }

    // 4. Device check
    if (deviceFingerprint) {
      const existingDevice = await prisma.deviceRegistration.findUnique({ where: { userId } });
      if (existingDevice && existingDevice.fingerprint !== deviceFingerprint) {
        await prisma.securityAlert.create({
          data: { userId, type: 'duplicate_device', message: 'Attendance from unregistered device', details: `Expected: ${existingDevice.fingerprint.substring(0, 8)}..., Got: ${deviceFingerprint.substring(0, 8)}...` },
        });
        return NextResponse.json({ error: 'This device is not registered for your account. Contact admin.' }, { status: 400 });
      }
      if (!existingDevice) {
        await prisma.deviceRegistration.create({
          data: { userId, fingerprint: deviceFingerprint, userAgent: body.userAgent || '' },
        });
      }
    }

    // 5. Find student linked to this user
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) {
      return NextResponse.json({ error: 'No student profile linked to your account' }, { status: 400 });
    }

    // 6. Check enrollment
    const enrollment = attSession.batch.admissions.find((a: any) => a.studentId === student.id);
    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this batch' }, { status: 400 });
    }

    // 7. Mark attendance
    const today = new Date().toISOString().split('T')[0];
    const attendance = await prisma.attendance.upsert({
      where: { date_studentId_batchId: { date: today, studentId: student.id, batchId: attSession.batchId } },
      create: {
        date: today,
        status: 'present',
        studentId: student.id,
        batchId: attSession.batchId,
        markedById: userId,
        deviceFingerprint,
        latitude,
        longitude,
        verificationMethod: body.faceVerified ? 'qr+face' : 'qr',
        sessionId: attSession.id,
      },
      update: {
        status: 'present',
        verificationMethod: body.faceVerified ? 'qr+face' : 'qr',
        deviceFingerprint,
        latitude,
        longitude,
      },
    });

    return NextResponse.json({ success: true, message: 'Attendance marked successfully!', attendance });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 });
  }
}
