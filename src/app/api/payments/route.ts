import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const mode = searchParams.get('mode') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { admission: { student: { name: { contains: search } } } },
      ];
    }
    if (mode) where.paymentMode = mode;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { admission: { include: { student: true, course: true } } },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, page, totalPages: Math.ceil(total / limit) });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate receipt number
    const count = await prisma.payment.count();
    const receiptNo = `RCP${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        admissionId: body.admissionId,
        amount: body.amount,
        paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
        paymentMode: body.paymentMode || 'cash',
        receiptNo,
        reference: body.reference || '',
        notes: body.notes || '',
      },
      include: { admission: { include: { student: true, course: true } } },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
