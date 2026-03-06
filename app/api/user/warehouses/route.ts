import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';

interface TokenDetailsType {
    userId: number;
    exp: number;
}
export async function POST(req: NextRequest){
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if(!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const decoded = jwtDecode<TokenDetailsType>(token);
        if(decoded.exp * 1000 < Date.now()) return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }
        const data = await req.json();
        const warehouseCode = await generateUniqueWarehouseCode(decoded.userId);
        const warehouse = await prisma.warehouse.create({
            data: {
                ...data,
                userId: decoded.userId,
                warehouseCode: warehouseCode,
                id: undefined
            }
        })
        // Register under ALL Delhivery tokens (surface 500g, 2kg, 5kg, express)
        const allTokens = [
            process.env.DELHIVERY_TOKEN_SURFACE_500G,
            process.env.DELHIVERY_TOKEN_SURFACE_2KG,
            process.env.DELHIVERY_TOKEN_SURFACE_5KG,
            process.env.DELHIVERY_TOKEN_EXPRESS_500G,
        ].filter(Boolean);

        for (const token of allTokens) {
            try {
                const res = await axios.post(
                    'https://track.delhivery.com/api/backend/clientwarehouse/create/',
                    {
                        name: data.warehouseName,
                        phone: data.mobile,
                        address: `${data.address1}${data.address2 ? ', ' + data.address2 : ''}`,
                        city: data.city,
                        pin: data.pincode,
                        state: data.state,
                        country: 'India',
                        registered_name: data.warehouseName,
                        return_address: `${data.address1}${data.address2 ? ', ' + data.address2 : ''}`,
                        return_pin: data.pincode,
                        return_city: data.city,
                        return_state: data.state,
                        return_country: 'India'
                    },
                    { headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' } }
                );
                console.log(`Delhivery warehouse registered (${token!.slice(0,8)}...):`, res.data?.success);
            } catch (e: any) {
                console.error(`Delhivery register failed (${token!.slice(0,8)}...):`, e.response?.data || e.message);
            }
        }
        return NextResponse.json({ message: "Warehouse added successfully", warehouse }, { status: 201 });
    }catch (error){
        return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });  
    }
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = jwtDecode<TokenDetailsType>(token);
        if (decoded.exp * 1000 < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 });

        const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
        const userId = decoded.userId;
        
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
        }

        const warehouses = await prisma.warehouse.findMany({
            where: {
                userId,
                OR: search
                    ? [
                        { warehouseName: { contains: search, mode: "insensitive" } },
                        { city: { contains: search, mode: "insensitive" } },
                        { state: { contains: search, mode: "insensitive" } },
                        { pincode: { contains: search, mode: "insensitive" } },
                    ]
                    : undefined,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ warehouses });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
    }
}
 

async function generateUniqueWarehouseCode(userId: number): Promise<string> {
    const timestampSuffix = Date.now().toString().slice(-6);
    const code = `SQW${userId}${timestampSuffix}`;
    return code;
}