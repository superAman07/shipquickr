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
        NOT: { kycStatus: undefined },  
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


export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ success: false, message: "Missing userId or status" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { kycStatus: status.toLowerCase() },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update KYC status' },
      { status: 500 }
    );
  }
}