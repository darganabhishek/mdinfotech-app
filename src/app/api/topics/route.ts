import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  try {
    const where: any = {};
    if (courseId) where.courseId = parseInt(courseId);

    const topics = await prisma.topic.findMany({
      where,
      include: {
        _count: { select: { assignments: true } }
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const topic = await prisma.topic.create({
      data: {
        name: body.name,
        courseId: parseInt(body.courseId),
      },
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
