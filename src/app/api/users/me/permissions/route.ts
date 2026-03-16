import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { username: session.user.email },
      include: {
        role: {
          include: { permissions: true }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roleName = dbUser.role?.name || 'staff';
    const permissions = dbUser.role?.permissions.map((p: any) => p.name) || [];

    let isEnrolled = false;
    let studentId = null;

    if (roleName.toLowerCase() === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId: dbUser.id },
        include: { admissions: { take: 1 } }
      });
      if (student) {
        studentId = student.id;
        isEnrolled = student.admissions.length > 0;
      }
    }

    return NextResponse.json({ 
      role: roleName, 
      permissions,
      isEnrolled,
      studentId
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
