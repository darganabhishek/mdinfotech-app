import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toTitleCase, formatFacultyData } from '@/lib/utils';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const faculty = await prisma.faculty.findMany({
      orderBy: { name: 'asc' },
    });
    const formattedFaculty = faculty.map(formatFacultyData);
    return NextResponse.json(formattedFaculty);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const faculty = await prisma.faculty.create({
      data: {
        ...data,
        name: toTitleCase(data.name || ''),
        qualification: toTitleCase(data.qualification || ''),
        specialization: toTitleCase(data.specialization || ''),
        joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      }
    });
    return NextResponse.json(formatFacultyData(faculty));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create faculty' }, { status: 500 });
  }
}
