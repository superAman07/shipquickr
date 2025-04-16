import { prisma } from "@/lib/prisma";
import { ratelimit } from "@/lib/rateLimit";
import { changePasswordSchema } from "@/lib/validator/userSchema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest){
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = await ratelimit.limit(ip as string);

    if (!success) {
        return NextResponse.json(
            { message: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }
    try{
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log("Token:", token);
        const decoded = verifyToken(token)
        console.log("Decoded Token:", decoded);
        const userId = decoded.userId;
        console.log("User ID:", userId);

        const json = await req.json();
        const parsed = changePasswordSchema.safeParse(json);
        if(!parsed.success){
            const errorMessages = parsed.error.errors.map(err => err.message);
            return NextResponse.json(
                { message: "Validation Error", errors: errorMessages },
                { status: 400 }
            );
        }
        const {currentPassword, newPassword} = parsed.data;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Current password is incorrect" },
                { status: 400 }
            );
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { password: hashedPassword },
        });
        return NextResponse.json(
            { message: "Password updated successfully" },
            { status: 200 }
        );

    }catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}