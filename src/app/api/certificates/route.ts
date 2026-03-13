import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admission: {
          include: {
            student: true,
            course: true
          }
        }
      }
    });
    return NextResponse.json(certificates);
  } catch (error) {
    console.error('Fetch certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate certificate number: CERT-YEAR-COUNT
    const count = await prisma.certificate.count();
    const certificateNo = `CERT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    
    const certificate = await prisma.certificate.create({
      data: {
        admissionId: Number(body.admissionId),
        certificateNo,
        issueDate: body.issueDate || new Date().toISOString().split('T')[0],
        grade: body.grade || '',
      },
      include: {
        admission: {
          include: {
            student: true,
            course: true
          }
        }
      }
    });
    
    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error('Issue certificate error:', error);
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}
