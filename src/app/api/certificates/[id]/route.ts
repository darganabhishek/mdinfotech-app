import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ message: 'Certificate revoked' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    return NextResponse.json({ error: 'Failed to revoke certificate' }, { status: 500 });
  }
}
