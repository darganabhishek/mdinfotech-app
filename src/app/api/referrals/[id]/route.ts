import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = parseInt(idStr);
    const body = await req.json();
    
    const referral = await prisma.referral.update({
      where: { id },
      data: {
        status: body.status,
        rewardAmount: body.rewardAmount !== undefined ? parseFloat(body.rewardAmount) : undefined,
        rewardPaid: body.rewardPaid,
        notes: body.notes,
      },
    });
    
    return NextResponse.json(referral);
  } catch (error) {
    console.error('Failed to update referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = parseInt(idStr);
    await prisma.referral.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Referral deleted' });
  } catch (error) {
    console.error('Failed to delete referral:', error);
    return NextResponse.json({ error: 'Failed to delete referral' }, { status: 500 });
  }
}
