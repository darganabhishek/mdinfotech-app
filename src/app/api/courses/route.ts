import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { admissions: true, batches: true } } },
    });
    return NextResponse.json(courses);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const course = await prisma.course.create({ data: body });
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
