import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendResetEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ message: 'If email exists, a reset link will be sent' });
  }

  const token = jwt.sign(
    { userId: user.id , role: user.role},
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  await sendResetEmail(email, token, user.role);

  return NextResponse.json({ message: 'Reset link sent if email exists' });
}
