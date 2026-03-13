import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const course = await prisma.course.update({ where: { id: parseInt(id) }, data: body });
    return NextResponse.json(course);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.course.update({ where: { id: parseInt(id) }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
