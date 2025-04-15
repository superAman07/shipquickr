import { z } from "zod";

export const signupSchema = z.object({
    firstName: z.string().min(1,"First name is required"),
    lastName: z.string().min(1,"Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6,"Password must be atleast 6 characters"),
    role: z.enum(["user", "admin"]).optional(), 
})

export const signinSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6,"Password is invalid")
})

export const forgetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});