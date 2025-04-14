
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; 
import bcrypt from "bcrypt" 
import { signupSchema } from "@/lib/validator/userSchema";

export async function POST(req: NextRequest){
    try{
        const json = await req.json();
        const parsed = signupSchema.safeParse(json);
        if(!parsed.success){
            const errorMessages = parsed.error.errors.map(err => err.message);
            return NextResponse.json(
                { message: "Validation Error", errors: errorMessages },
                { status: 400 }
            );
        }

        const {firstName,lastName,email,password, role} = parsed.data;
        const alreadyExist = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if(alreadyExist){
            return NextResponse.json({message:"User Already Exist. Please login"}, {status: 409})
        }
        const hashedpassword = await bcrypt.hash(password,10);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedpassword,
                role: role === "admin" ? "admin" : "user",
            }
        })
        if(user){
            return NextResponse.json({message: "User Added Successfully"},{status:201});
        }
    }catch(e){
        console.error("Signup Error:", e);
        return NextResponse.json({message: "Error while adding User"},{status:500})
    }
}