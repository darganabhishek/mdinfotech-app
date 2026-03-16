import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: parseInt(session.user.id) },
      include: {
        admissions: {
          include: {
            course: true,
            batch: true,
            payments: true,
          }
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' }
        },
        submissions: {
          include: {
            assignment: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Fetch student me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
