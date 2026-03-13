import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const where: any = {};
    if (courseId) where.courseId = parseInt(courseId);
    const batches = await prisma.batch.findMany({ where, orderBy: { name: 'asc' }, include: { course: true, _count: { select: { admissions: true } } } });
    return NextResponse.json(batches);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const batch = await prisma.batch.create({ data: body });
    return NextResponse.json(batch, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
