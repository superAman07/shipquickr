import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt"
import { signupSchema } from "@/lib/validator/userSchema";
import { ratelimit } from "@/lib/rateLimit";
import { randomInt } from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = await ratelimit.limit(ip as string);

    if (!success) {
        return NextResponse.json(
            { message: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }
    try {
        const json = await req.json();

        // 1. If OTP is provided, we are verifying and creating the user
        if (json.otp) {
            const { email, otp, firstName, lastName, password } = json;

            // We use status: "none" to identify unverified signups
            const tempUser = await prisma.user.findFirst({
                where: { email, kycStatus: "none" }
            });

            if (!tempUser || !tempUser.hashedOtp || !tempUser.otpExpires) {
                return NextResponse.json({ message: "OTP session expired or invalid. Please sign up again." }, { status: 400 });
            }
            if (new Date() > new Date(tempUser.otpExpires)) {
                return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
            }

            const isOtpValid = await bcrypt.compare(otp, tempUser.hashedOtp);
            if (!isOtpValid) {
                return NextResponse.json({ message: "Invalid OTP provided." }, { status: 401 });
            }

            // OTP perfectly valid! Activate the user account fully (start with kycStatus: none).
            await prisma.user.update({
                where: { id: tempUser.id },
                data: {
                    kycStatus: "none",
                    hashedOtp: null,
                    otpExpires: null,
                    lastLogin: new Date()
                }
            });
            return NextResponse.json({ message: "User Added Successfully" }, { status: 201 });
        }

        // 2. If NO OTP provided, this is step 1: Validate payload and Send OTP
        const parsed = signupSchema.safeParse(json);
        if (!parsed.success) {
            const errorMessages = parsed.error.errors.map(err => err.message);
            return NextResponse.json(
                { message: "Validation Error", errors: errorMessages },
                { status: 400 }
            );
        }

        const { firstName, lastName, email, password, role } = parsed.data;
        const alreadyExist = await prisma.user.findFirst({
            where: { email: email }
        });

        if (role === "admin") {
            return NextResponse.json({ message: "Admin registration is not allowed." }, { status: 403 });
        }

        // If user exists and is fully registered (not "none")
        if (alreadyExist && alreadyExist.kycStatus !== "none") {
            return NextResponse.json({ message: "User Already Exist. Please login" }, { status: 409 })
        }

        // Generate OTP
        const newOtp = randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(newOtp, 10);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const hashedpassword = await bcrypt.hash(password, 10);

        if (alreadyExist && alreadyExist.kycStatus === "none") {
            // Re-send OTP to existing pending user
            await prisma.user.update({
                where: { id: alreadyExist.id },
                data: { hashedOtp, otpExpires, password: hashedpassword, firstName, lastName }
            });
        } else {
            // Create pending user with kycStatus: "none"
            await prisma.user.create({
                data: {
                    firstName, lastName, email,
                    password: hashedpassword,
                    role: "user",
                    kycStatus: "none", // Valid enum value!
                    hashedOtp,
                    otpExpires
                }
            });
        }

        await sendEmail({
            to: email,
            subject: "Verify your ShipQuickr Account",
            html: `<p>Welcome to ShipQuickr! Your email verification code is:</p>
                        <div style="text-align: center;">
                            <span class="otp-code">${newOtp}</span>
                        </div>
                    <p>This code is secure and valid for exactly 10 minutes.</p>`,
        });

        return NextResponse.json({ message: "Verification code sent to your email.", otpRequired: true }, { status: 200 });

    } catch (e) {
        console.error("Signup Error:", e);
        return NextResponse.json({ message: "Error while adding User" }, { status: 500 })
    }
}