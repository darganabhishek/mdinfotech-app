import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, data } = await req.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    let count = 0;
    const errors: string[] = [];

    if (type === 'users') {
      const defaultPassword = await hash('Welcome123', 12);
      const roles = await prisma.role.findMany();
      
      for (const item of data) {
        try {
          const role = roles.find(r => r.name.toLowerCase() === (item.role || 'staff').toLowerCase());
          await prisma.user.create({
            data: {
              name: item.name,
              username: item.username,
              password: item.password ? await hash(item.password, 12) : defaultPassword,
              roleId: role?.id || null,
              active: true,
            }
          });
          count++;
        } catch (e: any) {
          errors.push(`User ${item.username}: ${e.message}`);
        }
      }
    } else if (type === 'students') {
      for (const item of data) {
        try {
          await prisma.student.create({
            data: {
              name: item.name,
              enrollmentNo: item.enrollmentNo || `ENR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              fatherName: item.fatherName || '',
              motherName: item.motherName || '',
              phone: item.phone || '',
              email: item.email || '',
              address: item.address || '',
              dob: item.dob || '',
              gender: item.gender || '',
              qualification: item.qualification || '',
              aadhaarNo: item.aadhaarNo || '',
              status: 'active',
            }
          });
          count++;
        } catch (e: any) {
          errors.push(`Student ${item.name}: ${e.message}`);
        }
      }
    } else if (type === 'faculty') {
      for (const item of data) {
        try {
          await prisma.faculty.create({
            data: {
              name: item.name,
              email: item.email || '',
              phone: item.phone || '',
              qualification: item.qualification || '',
              specialization: item.specialization || '',
              salary: parseFloat(item.salary) || 0,
              active: true,
            }
          });
          count++;
        } catch (e: any) {
          errors.push(`Faculty ${item.name}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count, 
      failed: errors.length,
      errors: errors.slice(0, 10) // Only return first 10 errors
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
