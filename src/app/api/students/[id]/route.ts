import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { admissions: { include: { course: true, batch: true, payments: true } } },
    });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: body,
    });
    return NextResponse.json(student);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.student.update({ where: { id: parseInt(id) }, data: { status: 'inactive' } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
