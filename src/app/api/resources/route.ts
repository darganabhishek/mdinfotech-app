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

    const resources = await prisma.elearningResource.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        faculty: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const resource = await prisma.elearningResource.create({
      data: {
        title: body.title,
        description: body.description || '',
        type: body.type,
        url: body.url,
        courseId: body.courseId ? parseInt(body.courseId) : null,
        facultyId: body.facultyId ? parseInt(body.facultyId) : null,
      },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Resource create error:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
