import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mark Attendance
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { date, batchId: globalBatchId, attendanceData } = await req.json(); // attendanceData: [{studentId, status, notes, batchId?}]
    
    const marks = await Promise.all(attendanceData.map((record: any) => {
      const targetBatchId = record.batchId || globalBatchId;
      
      if (!targetBatchId) {
        throw new Error(`No batchId found for student ${record.studentId}`);
      }

      return prisma.attendance.upsert({
        where: {
          date_studentId_batchId: {
            date,
            studentId: record.studentId,
            batchId: targetBatchId
          }
        },
        update: {
          status: record.status,
          notes: record.notes || '',
          markedById: parseInt(session.user.id)
        },
        create: {
          date,
          studentId: record.studentId,
          batchId: targetBatchId,
          status: record.status,
          notes: record.notes || '',
          markedById: parseInt(session.user.id)
        }
      });
    }));

    return NextResponse.json({ success: true, count: marks.length });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}

// Fetch Attendance
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const date = searchParams.get('date');
  const studentId = searchParams.get('studentId');
  const timeSlotId = searchParams.get('timeSlotId');

  try {
    const where: any = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (date) where.date = date;
    if (studentId) where.studentId = parseInt(studentId);
    if (timeSlotId) {
      where.batch = { timeSlotId: parseInt(timeSlotId) };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { name: true, enrollmentNo: true } },
        markedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
