import { prisma } from "@/lib/prisma";
import { signinSchema } from "@/lib/validator/userSchema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt"
import { signToken } from "@/lib/jwt";
import { ratelimit } from "@/lib/rateLimit";

export async function POST(req:NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = await ratelimit.limit(ip as string);

    if (!success) {
        return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
        );
    }
    try{
        const json = await req.json();
        const parsed = signinSchema.safeParse(json);
        if(!parsed.success){
            const errorMessages = parsed.error.errors.map(err => err.message);
            return NextResponse.json(
                { message: "Validation Error", errors: errorMessages },
                { status: 400 }
            );
        }
        const {email,password} = parsed.data;
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        }) 
        if(!user){
            return NextResponse.json(
              { message: "User not found. Please sign up first." },
              { status: 404 }
            );
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid password." },
                { status: 401 }
            );
        }
        const token = signToken({userId: user.id, firstName: user.firstName,lastName:user.lastName, email: user.email, role: user.role}, process.env.JWT_SECRET || "default_secret")
        const response = NextResponse.json(
            { message: "Login successful" },
            { status: 200 }
          );
        response.cookies.set("token",token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: '/',
            maxAge: 60*60,
            sameSite: "strict",
        })
        return response;
    }catch(e){
        console.error("Signin Error:", e);
        return NextResponse.json({
            message:"Error while Login"
        },{status:500})
    }
}