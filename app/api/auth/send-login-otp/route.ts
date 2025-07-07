import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import { sendEmail }  from "@/lib/email";  

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User with this email does not exist." }, { status: 404 });
    }

    const otp = randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    await prisma.user.update({
      where: { email },
      data: {
        hashedOtp,
        otpExpires,
      },
    });

    // Send the OTP via email
    await sendEmail({
      to: email,
      subject: "Your Login OTP for ShipQuickr",
      html: `<p>Your One-Time Password is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
    });

    return NextResponse.json({ message: "OTP sent to your email successfully." }, { status: 200 });

  } catch (error) {
    console.error("SEND_OTP_ERROR", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}