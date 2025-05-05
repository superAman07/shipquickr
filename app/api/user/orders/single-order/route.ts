import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server"; 

interface TokenDetailsType {
    userId: number;
    exp: number;
}
export async function POST(req: NextRequest){
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get('userToken')?.value;
        if(!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const decoded = jwtDecode<TokenDetailsType>(token)
        if(decoded.exp * 1000 < Date.now()){
            return new Response(JSON.stringify({ error: "Token expired" }), { status: 401 });
        }
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.kycStatus !== "approved") {
            return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
          }
        const data = await req.json();

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
           if (isNaN(Number(item.orderValue)) || Number(item.orderValue) < 0) {
               return NextResponse.json({ error: `Invalid orderValue for item: ${item.productName}` }, { status: 400 });
          }
        }
        const totalOrderValue = data.items.reduce((sum: number, item: any) => sum + (Number(item.orderValue) * Number(item.quantity)), 0);

        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
              data: { 
                  userId: decoded.userId,
                  orderId: data.orderId,
                  orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
                  paymentMode: data.paymentMode,
                  physicalWeight: parseFloat(data.physicalWeight) || 0,
                  length: parseFloat(data.length) || 0,
                  breadth: parseFloat(data.breadth) || 0,
                  height: parseFloat(data.height) || 0,
                  pickupLocation: data.pickupLocation,  
                  codAmount: data.paymentMode === "COD" ? (parseFloat(data.codAmount) || 0) : null,
 
                  customerName: data.customerName,
                  mobile: data.mobile,
                  email: data.email,
                  address: data.address,
                  pincode: data.pincode,
                  state: data.state,
                  city: data.city,
                  landmark: data.landmark,
                  status: "unshipped",  
              }
            });
 
          const orderItemsData = data.items.map((item: any) => ({
              orderId: order.id,
              productName: item.productName,
              category: item.category,
              quantity: parseInt(item.quantity),
              orderValue: parseFloat(item.orderValue),
              hsn: item.hsn,
          }));

          await tx.orderItem.createMany({
              data: orderItemsData,
          });
        return { ...order, items: orderItemsData};  
      });  
      return NextResponse.json(result, { status: 201 });
    }catch (error: any) {
      console.error("Error creating single order:", error);
      if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) { // More specific check for unique constraint on orderId
        return NextResponse.json({ error: "This Order ID already exists. Please use a unique Order ID." }, { status: 409 });
      } 
      return NextResponse.json({ error: "Failed to create order", details: error.message || error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("userToken")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwtDecode<TokenDetailsType>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.kycStatus !== "approved") {
      return NextResponse.json({ error: "KYC not verified" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") as any; 

    const orders = await prisma.order.findMany({
      where: {
        userId: decoded.userId,
        ...(status ? { status: { equals: status } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,  
      },
    });

    return NextResponse.json({ orders },{status: 200});
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message || error }, { status: 500 });
  }
}


 