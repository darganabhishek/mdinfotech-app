import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateEnrollmentNo } from '@/lib/student';
import { toTitleCase, formatStudentData } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const all = searchParams.get('all') === 'true';
    const hasAdmission = searchParams.get('hasAdmission');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { enrollmentNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    
    // Default: Show only students WITHOUT admissions (Leads)
    // If hasAdmission is provided, filter based on that
    if (!all) {
      if (hasAdmission === 'true') {
        where.admissions = { some: {} };
      } else if (hasAdmission === 'false') {
        where.admissions = { none: {} };
      } else {
        // DEFAULT behavior: show only leads
        where.admissions = { none: {} };
      }
    }

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

    // Format names to Title Case for display
    const formattedStudents = students.map(formatStudentData);

    return NextResponse.json({ students: formattedStudents, total, page, totalPages: Math.ceil(total / limit) });
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
    const enrollmentNo = await generateEnrollmentNo();

    const student = await prisma.student.create({
      data: {
        enrollmentNo,
        name: toTitleCase(body.name || ''),
        fatherName: toTitleCase(body.fatherName || ''),
        motherName: toTitleCase(body.motherName || ''),
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        city: toTitleCase(body.city || ''),
        state: toTitleCase(body.state || ''),
        pincode: body.pincode || '',
        dob: body.dob || '',
        gender: body.gender || '',
        qualification: toTitleCase(body.qualification || ''),
        status: 'active',
      },
    });

    return NextResponse.json(formatStudentData(student), { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
