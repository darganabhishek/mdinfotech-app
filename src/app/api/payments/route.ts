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
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Determine Financial Year (April to March)
    let fyStart, fyEnd;
    if (currentMonth >= 4) {
      fyStart = `${currentYear}-04-01`;
      fyEnd = `${currentYear + 1}-03-31`;
    } else {
      fyStart = `${currentYear - 1}-04-01`;
      fyEnd = `${currentYear}-03-31`;
    }

    const fyLabel = currentMonth >= 4 
      ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
      : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

    // Get count of receipts in this financial year
    const count = await prisma.payment.count({
      where: {
        createdAt: {
          gte: new Date(fyStart),
          lte: new Date(fyEnd)
        }
      }
    });

    const receiptNo = `MDI/${fyLabel}/${String(count + 1).padStart(4, '0')}`;

    // Auto-generate reference for cash if empty
    let reference = body.reference || '';
    if (body.paymentMode === 'cash' && !reference) {
      reference = `CSH-${Date.now().toString().slice(-6)}`;
    }

    const payment = await prisma.payment.create({
      data: {
        admissionId: body.admissionId,
        amount: body.amount,
        discount: body.discount || 0,
        paymentDate: body.paymentDate || now.toISOString().split('T')[0],
        paymentMode: body.paymentMode || 'cash',
        paymentMonth: body.paymentMonth || null,
        receiptNo,
        reference,
        notes: body.notes || '',
      },
      include: { admission: { include: { student: true, course: true } } },
    });

    // Update Admission netFee if discount was applied at transaction level?
    // Usually, we should deduce the balance. 
    // If the user meant the discount to be PERMANENT, we update admission.
    // If they meant it just for this payment, it's just recorded.
    // Based on "student balance reflects both the payment and the discount", 
    // we should update the admission's cumulative discount or netFee.
    
    if (body.discount > 0) {
      await prisma.admission.update({
        where: { id: body.admissionId },
        data: {
          discount: { increment: body.discount },
          netFee: { decrement: body.discount }
        }
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
