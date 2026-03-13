import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'active'; // 'active', 'completed', 'dropped'
    
    const where: any = { status };
    if (search) {
      where.OR = [
        { student: { name: { contains: search } } },
        { student: { enrollmentNo: { contains: search } } },
        { course: { name: { contains: search } } },
      ];
    }

    const admissions = await prisma.admission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        student: true, 
        course: true, 
        payments: { orderBy: { paymentDate: 'desc' } }
      },
    });

    // Calculate smart fee fields for each admission
    const feeData = admissions.map(adm => {
      const totalPaid = adm.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingFee = Math.max(0, adm.netFee - totalPaid);
      const isFeeCompleted = totalPaid >= adm.netFee;
      
      let nextDueAmount = 0;
      let nextDueDate = '';
      
      if (!isFeeCompleted) {
        if (adm.paymentPlan === 'full') {
          nextDueAmount = remainingFee;
        } else if (adm.paymentPlan === 'monthly' && adm.installmentAmount) {
          // Calculate months passed since admission
          const admDate = new Date(adm.admissionDate || adm.createdAt);
          const today = new Date();
          let monthsPassed = (today.getFullYear() - admDate.getFullYear()) * 12 + (today.getMonth() - admDate.getMonth());
          if (today.getDate() >= admDate.getDate()) monthsPassed++; // +1 if we passed the due date this month
          
          monthsPassed = Math.max(1, monthsPassed); // Minimum 1 month due
          if (adm.installmentsCount && monthsPassed > adm.installmentsCount) {
             monthsPassed = adm.installmentsCount;
          }

          const expectedTotal = monthsPassed * adm.installmentAmount;
          nextDueAmount = expectedTotal - totalPaid;
          
          if (nextDueAmount < 0) nextDueAmount = 0; // Overpaid currently
          if (nextDueAmount > remainingFee) nextDueAmount = remainingFee; // Can't owe more than remaining total
          
          // Next due date: same day next month
          const nextDateObj = new Date(admDate);
          nextDateObj.setMonth(admDate.getMonth() + monthsPassed);
          nextDueDate = nextDateObj.toISOString().split('T')[0];
        }
      }

      return {
        ...adm,
        totalPaid,
        remainingFee,
        isFeeCompleted,
        nextDueAmount,
        nextDueDate,
      };
    });

    return NextResponse.json(feeData);
  } catch (error) {
    console.error('Fees API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fee data' }, { status: 500 });
  }
}
