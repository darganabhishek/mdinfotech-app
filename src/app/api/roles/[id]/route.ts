import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const roleId = parseInt(idStr);
    const { name, description, permissions } = await req.json();

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name.toLowerCase(),
        description,
        permissions: {
          set: permissions.map((id: number) => ({ id })),
        },
      },
      include: { permissions: true },
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const roleId = parseInt(idStr);

    const usersWithRole = await prisma.user.count({
      where: { roleId },
    });

    if (usersWithRole > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role assigned to users. Reassign users first.' 
      }, { status: 400 });
    }

    await prisma.role.delete({ where: { id: roleId } });
    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
