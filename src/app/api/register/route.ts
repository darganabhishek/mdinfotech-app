import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, phone, fatherName, motherName, dob, gender, address,
      city, state, pincode, qualification, aadhaarNo, prevKnowledge,
      courseId, batchTiming, dateOfJoining
    } = body;

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
        status: 'active',
      },
    });

    // 3. Handle Admission if course is selected
    if (courseId) {
      // Find course to get the fee
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
      });

      if (course) {
        // We'll create a default batch or just link to the first available one for this course if not specified
        // For simplicity, we'll try to find a batch that matches the timing if provided
        let batchId = null;
        if (batchTiming) {
          const batch = await prisma.batch.findFirst({
            where: {
              courseId: course.id,
              timing: { contains: batchTiming }
            }
          });
          batchId = batch?.id;
        }

        // If no specific batch found, just use the first active batch for this course
        if (!batchId) {
          const firstBatch = await prisma.batch.findFirst({
            where: { courseId: course.id, status: 'active' }
          });
          batchId = firstBatch?.id;
        }

        // If still no batch, we can't create an admission (schema requires batchId)
        // In a real scenario, we might want to create a "Default" batch or handle this error
        if (batchId) {
          await prisma.admission.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              batchId: batchId,
              admissionDate: dateOfJoining || new Date().toISOString().split('T')[0],
              totalFee: course.fee,
              netFee: course.fee,
              status: 'active',
              notes: `Registered via public form. Batch Preference: ${batchTiming || 'None'}`
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
