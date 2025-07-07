import { z } from "zod";

export const signupSchema = z.object({
    firstName: z.string().min(1,"First name is required"),
    lastName: z.string().min(1,"Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8,"Password must be atleast 6 characters"),
    role: z.enum(["user", "admin"]).optional(), 
})

export const signinSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8,"Password is invalid").optional(),
    otp: z.string().optional(),
    isAdmin: z.boolean().optional(),
}).refine(data => data.password || data.otp, {
  message: "Password or OTP is required",
  path: ["password"],  
});

export const forgetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

interface ChangePasswordSchemaInterface {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const changePasswordSchema: z.ZodType<ChangePasswordSchemaInterface> = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password is required")
      .transform((val) => val.trim()),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
      .regex(/[0-9]/, "New password must contain at least one number")
      .regex(/[@$!%*?&#]/, "New password must contain at least one special character")
      .transform((val) => val.trim()),
    confirmPassword: z
      .string()
      .min(8, "Confirm password is required")
      .transform((val) => val.trim()),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.newPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Confirm password must match the new password",
      });
    }
});