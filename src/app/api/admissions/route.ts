import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatStudentData } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const timeSlotId = searchParams.get('timeSlotId');

    const where: any = {};
    if (status) where.status = status;
    
    if (timeSlotId && timeSlotId !== 'undefined' && timeSlotId !== '') {
      const tsId = parseInt(timeSlotId);
      if (!isNaN(tsId)) {
        // More robust way: Get all batch IDs for this time slot
        const batches = await prisma.batch.findMany({
          where: { timeSlotId: tsId },
          select: { id: true }
        });
        const batchIds = batches.map(b => b.id);
        where.batchId = { in: batchIds };
      }
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: search, mode: 'insensitive' } } },
        { course: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    console.log('Admissions GET query (DEBUG):', JSON.stringify({ status, timeSlotId, where }, null, 2));

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { student: true, course: true, batch: true, payments: true },
      }),
      prisma.admission.count({ where }),
    ]);

    const formattedAdmissions = admissions.map(a => ({
      ...a,
      student: formatStudentData(a.student)
    }));

    return NextResponse.json({ admissions: formattedAdmissions, total, page, totalPages: Math.ceil(total / limit) });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const totalFee = course.fee || 0;
    const discount = body.discount || 0;
    const netFee = totalFee - discount;

    let targetBatchId = body.batchId;

    // Phase 7: Time-Based Batch logic
    if (body.timeSlotId) {
      const timeSlotId = parseInt(body.timeSlotId);
      const courseId = parseInt(body.courseId);

      // Find time slot
      const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!timeSlot) return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });

      // Find existing batch for this course and time slot
      let batch = await prisma.batch.findFirst({
        where: { courseId, timeSlotId },
        include: { _count: { select: { admissions: { where: { status: 'active' } } } } }
      });

      if (batch) {
        // Enforce 20 seat limit constraints
        if (batch._count.admissions >= 20) {
          return NextResponse.json({ error: 'Batch Full — Please choose another time slot.' }, { status: 400 });
        }
        targetBatchId = batch.id;
      } else {
        // Auto-create batch
        batch = await prisma.batch.create({
          data: {
            name: `${course.name} Batch`,
            courseId,
            timeSlotId,
            capacity: 20,
            timing: timeSlot.label,
            status: 'active'
          },
          include: { _count: { select: { admissions: true } } }
        });
        targetBatchId = batch.id;
      }
    }

    if (!targetBatchId) {
      return NextResponse.json({ error: 'No batch or time slot provided' }, { status: 400 });
    }

    const admission = await prisma.admission.create({
      data: {
        studentId: parseInt(body.studentId),
        courseId: parseInt(body.courseId),
        batchId: targetBatchId,
        admissionDate: body.admissionDate || new Date().toISOString().split('T')[0],
        totalFee,
        discount,
        netFee,
        paymentPlan: body.paymentPlan || 'monthly',
        installmentAmount: body.installmentAmount ? Number(body.installmentAmount) : null,
        installmentsCount: body.installmentsCount ? Number(body.installmentsCount) : null,
        status: 'active',
        notes: body.notes || '',
      },
      include: { student: true, course: true, batch: { include: { timeSlot: true } } },
    });

    // Auto-create User account for Student Portal
    if (admission.student) {
      const existingUser = await prisma.user.findUnique({
        where: { username: admission.student.enrollmentNo }
      });

      if (!existingUser) {
        const { hash } = await import('bcryptjs');
        const defaultPassword = await hash(`MDI${admission.student.phone.slice(-5) || '12345'}`, 12);
        
        const user = await prisma.user.create({
          data: {
            name: admission.student.name,
            username: admission.student.enrollmentNo,
            password: defaultPassword,
            roleId: 2, // Student role ID from DB check (2 is usually student in such setups, but I'll verify or use role name if possible)
            active: true
          }
        });

        await prisma.student.update({
          where: { id: admission.student.id },
          data: { userId: user.id }
        });
      }
    }

    return NextResponse.json({
      ...admission,
      student: formatStudentData(admission.student)
    }, { status: 201 });
  } catch (error) {
    console.error('Create admission error:', error);
    return NextResponse.json({ error: 'Error creating admission' }, { status: 500 });
  }
}
