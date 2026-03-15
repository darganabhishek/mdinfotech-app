import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toTitleCase, formatStudentData } from '@/lib/utils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { admissions: { include: { course: true, batch: true, payments: true } } },
    });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(formatStudentData(student));
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { phone, aadhaarNo } = body;

    if (phone && !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }

    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }

    // Clean data for Title Case
    const updateData = { ...body };
    if (updateData.name) updateData.name = toTitleCase(updateData.name);
    if (updateData.fatherName) updateData.fatherName = toTitleCase(updateData.fatherName);
    if (updateData.motherName) updateData.motherName = toTitleCase(updateData.motherName);
    if (updateData.city) updateData.city = toTitleCase(updateData.city);
    if (updateData.state) updateData.state = toTitleCase(updateData.state);
    if (updateData.qualification) updateData.qualification = toTitleCase(updateData.qualification);

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    return NextResponse.json(formatStudentData(student));
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Delete all related records first (cascade)
    await prisma.attendance.deleteMany({ where: { studentId: id } });
    await prisma.submission.deleteMany({ where: { studentId: id } });
    await prisma.referral.deleteMany({ where: { referrerStudentId: id } });

    // Delete payments tied to admissions, then admissions
    const admissions = await prisma.admission.findMany({ where: { studentId: id }, select: { id: true } });
    const admissionIds = admissions.map(a => a.id);
    if (admissionIds.length > 0) {
      await prisma.payment.deleteMany({ where: { admissionId: { in: admissionIds } } });
      await prisma.certificate.deleteMany({ where: { admissionId: { in: admissionIds } } });
      await prisma.admission.deleteMany({ where: { studentId: id } });
    }

    // Finally delete the student
    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Student permanently deleted' });
  } catch (error: any) {
    console.error('Student delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete student' }, { status: 500 });
  }
}
