import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const where: any = {};
    if (status) where.status = status;
    const enquiries = await prisma.enquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(enquiries);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const enquiry = await prisma.enquiry.create({ data: body });
    return NextResponse.json(enquiry, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
