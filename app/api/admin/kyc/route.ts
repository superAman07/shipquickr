import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        kycStatus: true,
        role: true,
        createdAt: true,
      },
      where: {
        role: 'user', 
        NOT: { kycStatus: undefined }, // remove users who haven't done any KYC
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching KYC users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch KYC users' },
      { status: 500 }
    );
  }
}
