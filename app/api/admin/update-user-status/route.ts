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
        where: {
          role: "user"
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

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const isPresent = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    if (!isPresent) {
      return NextResponse.json({ message: "User does not exist" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) }
    });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ message: "Error deleting user" }, { status: 500 });
  }
}
