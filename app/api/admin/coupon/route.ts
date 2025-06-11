import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value;
    if (!token) return false;
    try {
        const decoded: any = jwtDecode(token);
        return decoded.role === 'admin';
    } catch {
        return false;
    }
}
export async function GET(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(coupons);
}
export async function POST(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();
    try {
        const coupon = await prisma.coupon.create({
            data: {
                name: data.name,
                code: data.code,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                limit: parseInt(data.limit),
                condition: data.condition,
                amount: parseFloat(data.amount),
                schedule: data.schedule ? new Date(data.schedule) : null,
                status: data.status ?? true,
                createdBy: data.createdBy ?? null,
            }
        });
        return NextResponse.json(coupon, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function PUT(req: NextRequest) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();
    try {
        const coupon = await prisma.coupon.update({
            where: {
                id: parseInt(data.id)
            },
            data: {
                name: data.name,
                code: data.code,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                limit: parseInt(data.limit),
                condition: data.condition,
                amount: parseFloat(data.amount),
                schedule: data.schedule ? new Date(data.schedule) : null,
                status: data.status,
            }
        });
        return NextResponse.json(coupon);
    }catch (error: any){
        return NextResponse.json({error: error.message},{status: 400});
    }
}

export async function DELETE (req: NextRequest){
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {id} = await req.json();
    try {
        await prisma.coupon.delete({where: {id: parseInt(id)}});
        return NextResponse.json({success: true});
    }catch(error: any){
        return NextResponse.json({error: error.message}, {status: 400});
    }
}