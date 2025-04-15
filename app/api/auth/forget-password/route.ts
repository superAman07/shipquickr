import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendResetEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';
import { forgetPasswordSchema } from '@/lib/validator/userSchema';
import { ratelimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = await ratelimit.limit(ip as string);

  if (!success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const json = await req.json();
  const parsed = forgetPasswordSchema.safeParse(json);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map((err) => err.message);
    return NextResponse.json({ message: "Validation Error", errors: errorMessages }, { status: 400 });
  }

  const { email } = parsed.data;
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
