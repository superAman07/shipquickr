import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { verifyToken } from "@/lib/jwt";
import { number } from "zod";
import jwt from "jsonwebtoken";
interface DecodedToken {
    userId: string;   
}
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    console.log("Token received: ", token)
    let decoded: DecodedToken;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      console.log("Decoded token:", decoded);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ message: "Invalid or expired token." }, { status: 400 });
    }

    if (!decoded || !decoded.userId) {
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
