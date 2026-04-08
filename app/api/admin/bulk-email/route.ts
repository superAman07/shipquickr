import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("adminToken")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { role: string };
        if (decoded.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { userEmails, subject, message } = await req.json();

        if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
            return NextResponse.json({ message: "No users selected." }, { status: 400 });
        }

        if (!subject || !message) {
            return NextResponse.json({ message: "Subject and Message are required." }, { status: 400 });
        }

        // Rather than waiting for thousands of emails to process synchronously,
        // we fire them in the background so the admin UI responds quickly.
        const emailPromises = userEmails.map(async (email) => {
            try {
                // Check if we need to do basic replacements
                const user = await prisma.user.findUnique({ where: { email }, select: { firstName: true } });
                if (!user) return; // Skip if user not found for some reason

                // very simple templating
                const personalizedMessage = message.replace(/{firstName}/g, user.firstName);

                await sendEmail({
                    to: email,
                    subject: subject,
                    html: personalizedMessage
                });
            } catch (e) {
                console.error(`Failed to send email to ${email}:`, e);
            }
        });

        // We don't await all of them if it's huge, but for a typical bulk send we can await.
        await Promise.all(emailPromises);

        return NextResponse.json({ success: true, message: `Successfully dispatched emails to ${userEmails.length} users.` });
    } catch (error) {
        console.error("Bulk Email Error:", error);
        return NextResponse.json({ message: "An error occurred while sending emails." }, { status: 500 });
    }
}
