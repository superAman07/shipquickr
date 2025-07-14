import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        console.log("Token from onboardinng:", token);
        const decoded: any = jwtDecode(token);
        const userId = decoded.userId;
        console.log("User id from onboarding: ", userId);
        const { mobile, shipments } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { mobile: true }
        });
        if (user?.mobile) {
            return NextResponse.json({ error: "Onboarding already completed." }, { status: 403 });
        }

        console.log("Mobile and avg shipments frrom onboarding:", { mobile, shipments });
        const avgshipmentAndMobile = await prisma.user.update({
            where: { id: Number(userId) },
            data: {
                mobile,
                avgShippmentsFromUser: shipments,
            }
        });
        console.log("Avg shippments from route: ", avgshipmentAndMobile);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save mobile/avg shippments data" }, { status: 500 })
    }
}