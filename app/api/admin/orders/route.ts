import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
  userId: string;  
  role: string;
  exp: number;
}

export async function GET (req: NextRequest){
    try{
        const cookieStore = await cookies();
        const token  = cookieStore.get("adminToken")?.value;
        if(!token)return NextResponse.json({message:"Unauthorized"}, {status:401});
        const decoded = jwtDecode<TokenDetailsType>(token);
        if(decoded.exp * 1000 < Date.now()){
            return NextResponse.json({message:"Token expired"}, {status:401});
        }
        if(decoded.role !== "admin"){
            return NextResponse.json({message:"Forbidden"}, {status:401});
        }
        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const searchTerm = searchParams.get("search") || "";

        const skip = (page - 1) * limit;
        const whereClause: any = {};
        if (status && status !== "all") {
            whereClause.status = status;
        }
        if (searchTerm) {
            whereClause.OR = [
                { orderId: { contains: searchTerm, mode: "insensitive" } },
                { customerName: { contains: searchTerm, mode: "insensitive" } },
                { awbNumber: { contains: searchTerm, mode: "insensitive" } },
                { user: { email: { contains: searchTerm, mode: "insensitive" } } }, // Search by user's email
                { items: { some: { productName: { contains: searchTerm, mode: "insensitive" } } } },
            ];
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: true,
                
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: skip,
            take: limit,
        });

        const totalOrders = await prisma.order.count({
            where: whereClause,
        });

        return NextResponse.json({
            orders,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
        });

    }catch (error: any) {
      console.error("Error fetching orders for admin:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders", details: error.message },
        { status: 500 }
    );
  }
}