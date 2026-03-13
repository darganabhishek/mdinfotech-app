import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { enrollmentNo: { contains: search } } },
        { course: { name: { contains: search } } },
      ];
    }

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { student: true, course: true, batch: true, payments: true },
      }),
      prisma.admission.count({ where }),
    ]);

    return NextResponse.json({ admissions, total, page, totalPages: Math.ceil(total / limit) });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    const totalFee = course?.fee || 0;
    const discount = body.discount || 0;
    const netFee = totalFee - discount;

    const admission = await prisma.admission.create({
      data: {
        studentId: body.studentId,
        courseId: body.courseId,
        batchId: body.batchId,
        admissionDate: body.admissionDate || new Date().toISOString().split('T')[0],
        totalFee,
        discount,
        netFee,
        status: 'active',
        notes: body.notes || '',
      },
      include: { student: true, course: true, batch: true },
    });

    return NextResponse.json(admission, { status: 201 });
  } catch (error) {
    console.error('Create admission error:', error);
    return NextResponse.json({ error: 'Error creating admission' }, { status: 500 });
  }
}
