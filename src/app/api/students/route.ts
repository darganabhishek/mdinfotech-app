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
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { enrollmentNo: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { admissions: { include: { course: true } } },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, aadhaarNo } = body;

    if (phone && !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }

    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }

    // Generate enrollment number
    const count = await prisma.student.count();
    const enrollmentNo = `MDI${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;

    const student = await prisma.student.create({
      data: {
        enrollmentNo,
        name: body.name,
        fatherName: body.fatherName || '',
        motherName: body.motherName || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        pincode: body.pincode || '',
        dob: body.dob || '',
        gender: body.gender || '',
        qualification: body.qualification || '',
        status: 'active',
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
