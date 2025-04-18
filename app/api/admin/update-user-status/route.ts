import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
    try{
        const {userId,status} = await req.json();
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },data: {
                status
            }
        })
        return NextResponse.json({success: true, updatedUser});
    }catch(error){
        console.error("Error updating user status:", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }
}

export async function GET() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      return NextResponse.json({ success: true, data: users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }
}