import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      }, data: {
        status
      }
    })
    return NextResponse.json({ success: true, updatedUser });
  } catch (error) {
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
        kycStatus: true,
        kycDetail: {
          select: { updatedAt: true }
        },
        wallet: {
          select: { balance: true }
        },
        _count: {
          select: { orders: true }
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true }
        }
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

    const id = parseInt(userId);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const isPresent = await prisma.user.findUnique({
      where: { id }
    });

    if (!isPresent) {
      return NextResponse.json({ message: "User does not exist" }, { status: 404 });
    }

    // Perform deletion in a transaction to ensure all related data is cleaned up
    await prisma.$transaction(async (tx) => {
      // 1. Delete transactions first (they might link to orders)
      await tx.transaction.deleteMany({ where: { userId: id } });

      // 2. Fetch order IDs to clean up order-related tables
      const userOrders = await tx.order.findMany({
        where: { userId: id },
        select: { id: true }
      });
      const orderIds = userOrders.map(o => o.id);

      if (orderIds.length > 0) {
        // 3. Delete order-related records
        await tx.orderTracking.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.courierPayable.deleteMany({ where: { orderId: { in: orderIds } } });
      }

      // 4. Delete orders
      await tx.order.deleteMany({ where: { userId: id } });

      // 5. Delete core user-linked profiles
      await tx.remittance.deleteMany({ where: { userId: id } });
      await tx.kycDetail.deleteMany({ where: { userId: id } });
      await tx.wallet.deleteMany({ where: { userId: id } });
      await tx.warehouse.deleteMany({ where: { userId: id } });
      await tx.complaint.deleteMany({ where: { userId: id } });
      await tx.couponRedemption.deleteMany({ where: { userId: id } });
      await tx.userCourierAssignment.deleteMany({ where: { userId: id } });

      // 6. Finally delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: "User and all associated data deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ message: "Error deleting user. Possible database constraints." }, { status: 500 });
  }
}
