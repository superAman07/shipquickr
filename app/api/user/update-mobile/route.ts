import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("userToken")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
            return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }
        const userId = decoded.userId;
        const { mobile } = await req.json();
        await prisma.user.update({
            where: { id: Number(userId) },
            data: { mobile }
        })
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update mobile" }, { status: 500 });
    }
}