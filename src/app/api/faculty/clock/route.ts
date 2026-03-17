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
      if (!body.latitude || !body.longitude) {
        return NextResponse.json({ error: 'GPS location is mandatory. Please enable location.' }, { status: 400 });
      }
      if (!body.faceImage) {
        return NextResponse.json({ error: 'Face capture is mandatory.' }, { status: 400 });
      }

      const log = await prisma.facultyClockLog.create({
        data: {
          facultyId: faculty.id,
          clockIn: new Date(),
          latitude: body.latitude,
          longitude: body.longitude,
          faceImage: body.faceImage,
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

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedFacultyId = searchParams.get('facultyId');
  
  // Normalize role and ID
  const rawRole = (session.user as any).role || '';
  const userRole = rawRole.toLowerCase();
  const userId = parseInt(session.user.id);

  try {
    const where: any = {};

    // Only allow admins and superadmins to see all logs
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    if (isAdmin) {
      if (requestedFacultyId) where.facultyId = parseInt(requestedFacultyId);
      // If no facultyId provided, admins see ALL logs
    } else {
      // Non-admins (faculty/staff) can ONLY see their own logs
      const faculty = await prisma.faculty.findUnique({
        where: { userId }
      });

      if (!faculty) {
        // If the user isn't an admin and doesn't have a faculty record, they see nothing
        return NextResponse.json([]);
      }
      
      where.facultyId = faculty.id;
    }

    const logs = await prisma.facultyClockLog.findMany({
      where,
      include: { faculty: { select: { name: true } } },
      orderBy: { clockIn: 'desc' },
      take: 100,
    });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching faculty logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
