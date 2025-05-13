import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface TokenDetailsType {
  userId: string;
  role: string;
  exp: number;
}

interface RouteContext {
  params: {
    orderId: string; 
  };
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { orderId: orderIdString } = context.params;

    if (!orderIdString) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    const orderId = parseInt(orderIdString, 10);
    if (isNaN(orderId)) {
        return NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: TokenDetailsType;
    try {
      decoded = jwtDecode<TokenDetailsType>(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Error fetching single order for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch order", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { orderId:orderIdString } = context.params;

    if (!orderIdString) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    const orderId = parseInt(orderIdString, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid Order ID format" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: TokenDetailsType;
    try {
      decoded = jwtDecode<TokenDetailsType>(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
 
    const orderExists = await prisma.order.findUnique({
      where: { id: orderId },  
    });

    if (!orderExists) {
      return NextResponse.json({ error: `Order with ID ${orderId} not found` }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting order for admin:", error);
    if (error.code === 'P2003' || error.code === 'P2014') {  
        return NextResponse.json(
            { error: "Cannot delete order. It may be associated with other records (e.g., shipments, transactions). Please resolve these associations first." },
            { status: 409 }  
        );
    }
    return NextResponse.json(
      { error: "Failed to delete order", details: error.message },
      { status: 500 }
    );
  }
}