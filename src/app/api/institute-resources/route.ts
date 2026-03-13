import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const resource = await prisma.resource.create({
      data: {
        name: body.name,
        category: body.category,
        description: body.description || '',
        quantity: parseInt(body.quantity) || 1,
        available: parseInt(body.available) || parseInt(body.quantity) || 1,
        location: body.location || '',
        status: body.status || 'available',
        notes: body.notes || '',
      },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
