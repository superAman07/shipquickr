import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface TokenDetailsType {
  userId: string;  
  role: string;
  exp: number;
}

interface CreateOrderRequestBody {
  userId: string;  
  customerName: string;
  mobile: string;
  email?: string;
  address: string;
  landmark?: string;
  pincode: string;
  state: string;
  city: string;
  orderId: string;  
  orderDate: string;  
  paymentMode: "COD" | "Prepaid";
  items: Array<{
    productName: string;
    category: string;
    quantity: number;
    orderValue: number;
    hsn?: string;
  }>;
  codAmount?: number | null;
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
  pickupLocation: string; 
  warehouseId: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing admin token" }, { status: 401 });
    }

    let decodedAdmin: TokenDetailsType;
    try {
      decodedAdmin = jwtDecode<TokenDetailsType>(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }

    if (decodedAdmin.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Admin token expired" }, { status: 401 });
    }

    if (decodedAdmin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const data: CreateOrderRequestBody = await req.json();
 
    if (!data.userId) {
      return NextResponse.json({ error: "Target User ID is required to create an order." }, { status: 400 });
    }
    if (!data.orderId || !data.orderDate || !data.paymentMode || !data.warehouseId || !data.customerName || !data.mobile || !data.address || !data.pincode || !data.state || !data.city || !data.physicalWeight || !data.length || !data.breadth || !data.height) {
      return NextResponse.json({ error: "Missing required fields for order creation." }, { status: 400 });
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 });
    }
    for (const item of data.items) {
      if (!item.productName || !item.category || !item.quantity || !item.orderValue) {
        return NextResponse.json({ error: "Each item must have productName, category, quantity, and orderValue." }, { status: 400 });
      }
      if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        return NextResponse.json({ error: `Invalid quantity for item: ${item.productName}` }, { status: 400 });
      }
      if (isNaN(Number(item.orderValue)) || Number(item.orderValue) < 0) { // Allow 0 for free items
        return NextResponse.json({ error: `Invalid orderValue for item: ${item.productName}` }, { status: 400 });
      }
    }
    if (data.paymentMode === "COD" && (data.codAmount === undefined || data.codAmount === null || isNaN(Number(data.codAmount)) || Number(data.codAmount) <= 0)) {
      return NextResponse.json({ error: "Valid COD amount is required for COD orders." }, { status: 400 });
    } 

    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(data.userId) } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }
   
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: data.warehouseId,
        userId: parseInt(data.userId), 
      },
    });
    if (!warehouse) {
      return NextResponse.json({ error: "Selected pickup warehouse not found or does not belong to the target user." }, { status: 404 });
    }

    const totalOrderValue = data.items.reduce((sum, item) => sum + (Number(item.orderValue) * Number(item.quantity)), 0);

    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: parseInt(data.userId), 
          orderId: data.orderId,  
          orderDate: new Date(data.orderDate),
          paymentMode: data.paymentMode,
          physicalWeight: parseFloat(String(data.physicalWeight)) || 0,
          length: parseFloat(String(data.length)) || 0,
          breadth: parseFloat(String(data.breadth)) || 0,
          height: parseFloat(String(data.height)) || 0,
          pickupLocation: data.pickupLocation,  
          warehouseId: data.warehouseId,
          codAmount: data.paymentMode === "COD" ? (parseFloat(String(data.codAmount)) || 0) : null,
          customerName: data.customerName,
          mobile: data.mobile,
          email: data.email,
          address: data.address,
          pincode: data.pincode,
          state: data.state,
          city: data.city,
          landmark: data.landmark,
          status: "unshipped", 
        },
      });

      const orderItemsData = data.items.map((item) => ({
        orderId: newOrder.id, 
        productName: item.productName,
        category: item.category,
        quantity: parseInt(String(item.quantity), 10),
        orderValue: parseFloat(String(item.orderValue)),
        hsn: item.hsn,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      return { ...newOrder, items: orderItemsData };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error creating order for admin:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('orderId_userId_unique')) { // Adjust if your unique constraint is just on 'orderId'
      return NextResponse.json({ error: "This Order ID already exists for this user. Please use a unique Order ID." }, { status: 409 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) { // If unique constraint is globally on orderId
        return NextResponse.json({ error: "This Order ID already exists. Please use a unique Order ID." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order", details: error.message || String(error) }, { status: 500 });
  }
}