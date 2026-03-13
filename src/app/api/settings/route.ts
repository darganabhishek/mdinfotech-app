import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();
    
    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          instituteName: "M.D. INFOTECH",
          tagline: "Professional Computer Institute",
          address: "123 Tech Lane, Digital City, 54321",
          phone: "+91 9716161624",
          email: "itmdinfotech@gmail.com",
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { instituteName, tagline, address, phone, email } = data;

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { instituteName, tagline, address, phone, email },
      create: { id: 1, instituteName, tagline, address, phone, email },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
