import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import { resetPasswordSchema } from "@/lib/validator/userSchema";

interface DecodedToken {
  userId: string;
  role: string;
}
export async function POST(req: NextRequest){
  try {
    const json = await req.json();
    const parsed = resetPasswordSchema.safeParse(json);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((err) => err.message);
      return NextResponse.json({ message: "Validation Error", errors: errorMessages }, { status: 400 });
    }

    const { token, password } = parsed.data; 

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ message: "Invalid or expired token." }, { status: 400 });
    }

    if (!decoded || !decoded.userId || !decoded.role) {
        return NextResponse.json({ message: "Invalid token payload." }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: parseInt(decoded.userId,10) },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Error while resetting password." }, { status: 500 });
  }
}
