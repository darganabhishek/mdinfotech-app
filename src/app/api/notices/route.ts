import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const target = (session.user as any).role === 'student' ? 'student' : null;
    
    const where: any = {};
    
    if (target === 'student') {
      // Fetch notices for all, student's course, or specific student
      const student = await prisma.student.findUnique({
        where: { userId: parseInt(session.user.id) },
        include: { admissions: { select: { courseId: true } } }
      });

      if (!student) return NextResponse.json([]);

      const courseIds = student.admissions.map(a => a.courseId);

      where.OR = [
        { target: 'all' },
        { target: 'course', courseId: { in: courseIds } },
        { target: 'student', studentId: student.id }
      ];
    }

    const notices = await prisma.notice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { name: true, code: true } },
        student: { select: { name: true } }
      }
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'superadmin' && userRole !== 'staff' && userRole !== 'faculty')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        content: body.content || '',
        type: body.type || 'text',
        fileUrl: body.fileUrl || null,
        link: body.link || null,
        target: body.target || 'all',
        courseId: body.courseId ? parseInt(body.courseId) : null,
        studentId: body.studentId ? parseInt(body.studentId) : null,
      },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}
