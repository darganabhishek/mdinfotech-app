import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);
    const admissions = await prisma.admission.findMany({
      where: { batchId, status: 'active' },
      include: { student: true }
    });

    const students = admissions.map(a => a.student);
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
