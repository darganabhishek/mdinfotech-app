import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeBatches = searchParams.get('includeBatches') === 'true';

    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { startTime: 'asc' },
      include: includeBatches ? {
        batches: {
          include: {
            course: true,
            _count: { select: { admissions: { where: { status: 'active' } } } }
          }
        }
      } : undefined
    });
    return NextResponse.json(timeSlots);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 });
  }
}
