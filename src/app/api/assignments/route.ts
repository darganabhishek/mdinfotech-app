import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  try {
    const where: any = {};
    if (batchId) where.batchId = parseInt(batchId);

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        batch: { include: { course: true } },
        faculty: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const assignment = await prisma.assignment.create({
      data: {
        title: body.title,
        description: body.description || '',
        dueDate: body.dueDate,
        batchId: parseInt(body.batchId),
        facultyId: parseInt(body.facultyId),
        attachments: body.attachments || null,
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Assignment create error:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
