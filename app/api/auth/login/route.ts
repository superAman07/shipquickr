import { prisma } from "@/lib/prisma";
import { signinSchema } from "@/lib/validator/userSchema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt"
import { signToken } from "@/lib/jwt";
import { ratelimit } from "@/lib/rateLimit";
import { randomInt } from "crypto";
import { sendEmail } from "@/lib/email";

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
        const {email,password, otp ,isAdmin=false} = parsed.data;
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
        if (user.status === false) {
            return NextResponse.json({ message: "Your account has been deactivated. Please contact support." }, { status: 403 });
        }
        if (isAdmin && user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized: Not an admin account." }, { status: 403 });
        }
        if (!isAdmin && user.role === "admin") {
            return NextResponse.json({ message: "Unauthorized: Admin should login from admin portal." }, { status: 403 });
        }

        // if (otp) {
        //     if (!user.hashedOtp || !user.otpExpires) {
        //         return NextResponse.json({ message: "No OTP has been sent for this account." }, { status: 400 });
        //     }
        //     if (new Date() > new Date(user.otpExpires)) {
        //         return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
        //     }
        //     const isOtpValid = await bcrypt.compare(otp, user.hashedOtp);
        //     if (!isOtpValid) {
        //         return NextResponse.json({ message: "Invalid OTP provided." }, { status: 401 });
        //     } 
        //     await prisma.user.update({ where: { email }, data: { hashedOtp: null, otpExpires: null } });
        // } else if (password) {
        //     const isPasswordValid = await bcrypt.compare(password, user.password!);
        //     if (!isPasswordValid) {
        //         return NextResponse.json(
        //             { message: "Invalid password." },
        //             { status: 401 }
        //         );
        //     }
        // }
 
        if (otp) {
            if (!user.hashedOtp || !user.otpExpires) {
                return NextResponse.json({ message: "No OTP has been sent for this account." }, { status: 400 });
            }
            if (new Date() > new Date(user.otpExpires)) {
                return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
            }
            const isOtpValid = await bcrypt.compare(otp, user.hashedOtp);
            if (!isOtpValid) {
                return NextResponse.json({ message: "Invalid OTP provided." }, { status: 401 });
            } 
            await prisma.user.update({ where: { email }, data: { hashedOtp: null, otpExpires: null } });
            
            const token = signToken({userId: user.id, firstName: user.firstName,lastName:user.lastName, email: user.email, role: user.role}, process.env.JWT_SECRET || "default_secret")
            const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
            
            const cookieName = isAdmin ? "adminToken" : "userToken";
            response.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax', maxAge: 60 * 60 * 2 });
            
            return response;
        } 

        if (password) {
            if (!user.password) {
                return NextResponse.json({ message: "Password not set for this account. Try logging in with OTP." }, { status: 400 });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
            }

            if (isAdmin) {
                const token = signToken({userId: user.id, firstName: user.firstName,lastName:user.lastName, email: user.email, role: user.role}, process.env.JWT_SECRET || "default_secret");
                const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
                response.cookies.set("adminToken", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax', maxAge: 60 * 60 * 2 });
                return response;
            }
            
            // Password is valid, generate and send OTP
            const newOtp = randomInt(100000, 999999).toString();
            const hashedOtp = await bcrypt.hash(newOtp, 10);
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await prisma.user.update({
                where: { email },
                data: { hashedOtp, otpExpires },
            });

            await sendEmail({
                to: email,
                subject: "Your ShipQuickr Login Verification Code",
                html: `<p>Your login verification code is: <strong>${newOtp}</strong></p><p>It is valid for 10 minutes.</p>`,
            });

            return NextResponse.json({ message: "Verification code sent to your email.", otpRequired: true }, { status: 200 });
        }
        // if(user.status=== false){
        //     return NextResponse.json(
        //         { message: "Your account has been deactivated. Please contact support." },
        //         { status: 403 }
        //     );
        // }
        // if (isAdmin && user.role !== "admin") {
        //     return NextResponse.json(
        //       { message: "Unauthorized: Not an admin account." },
        //       { status: 403 }
        //     );
        // }
        // if (!isAdmin && user.role === "admin") {
        //     return NextResponse.json(
        //       { message: "Unauthorized: Admin should login from admin portal." },
        //       { status: 403 }
        //     );
        // }

        // const token = signToken({userId: user.id, firstName: user.firstName,lastName:user.lastName, email: user.email, role: user.role}, process.env.JWT_SECRET || "default_secret")
        // const response = NextResponse.json(
        //     { message: "Login successful" },
        //     { status: 200 }
        // );
        // const cookieName = isAdmin ? "adminToken" : "userToken";
        // response.cookies.set(cookieName,token,{
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     path: '/',
        //     maxAge: 60*60,
        //     sameSite: "lax",
        // })
        // return response;
    }catch(e){
        console.error("Signin Error:", e);
        return NextResponse.json({
            message:"Error while Login"
        },{status:500})
    }
}