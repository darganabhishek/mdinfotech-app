import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, phone, fatherName, motherName, dob, gender, address,
      city, state, pincode, qualification, aadhaarNo, prevKnowledge,
      courseId, batchTiming, dateOfJoining, photo
    } = body;

    if (!photo) {
      return NextResponse.json({ error: 'Photograph is mandatory' }, { status: 400 });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }

    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }

    // 1. Generate enrollment number
    const count = await prisma.student.count();
    const enrollmentNo = `MDI${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;

    // 2. Create Student
    const student = await prisma.student.create({
      data: {
        enrollmentNo,
        name,
        email: email || '',
        phone: phone || '',
        fatherName: fatherName || '',
        motherName: motherName || '',
        dob: dob || '',
        gender: gender || '',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        qualification: qualification || '',
        aadhaarNo: aadhaarNo || '',
        prevKnowledge: prevKnowledge || '',
        photo: photo || '',
        status: 'active',
      },
    });

    // 3. Handle Admission if course is selected
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
      });

      if (course) {
        await prisma.admission.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            admissionDate: dateOfJoining || new Date().toISOString().split('T')[0],
            totalFee: course.fee,
            netFee: course.fee,
            status: 'pending',
            notes: `Registered via public form. Batch Preference: ${batchTiming || 'None'}`,
            // @ts-ignore
            batchId: null,
          }
        });
      }
    }

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
