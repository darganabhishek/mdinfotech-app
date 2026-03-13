import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const referrals = await prisma.referral.findMany({
      include: { referrerStudent: { select: { name: true, enrollmentNo: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(referrals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const referral = await prisma.referral.create({
      data: {
        referrerStudentId: parseInt(body.referrerStudentId),
        referredName: body.referredName,
        referredPhone: body.referredPhone || '',
        referredEmail: body.referredEmail || '',
        courseInterested: body.courseInterested || '',
        rewardAmount: parseFloat(body.rewardAmount) || 0,
        notes: body.notes || '',
      },
    });
    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
