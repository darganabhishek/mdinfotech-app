import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        active: true,
        role: true,
        createdAt: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, username, password, roleId, active } = await req.json();
    
    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        roleId: parseInt(roleId),
        active,
      },
      include: { role: true },
    });
    
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
