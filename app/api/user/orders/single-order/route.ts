import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

async function calculateShippingCost(orderData: any): Promise<number> { 
  const rates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
  const baseRatePerKg = rates?.courierChargesAmount ?? 50; // Default: ₹50 per kg if not set
  const chargeType = rates?.courierChargesType ?? "fixed"; // Default: fixed
 
  const actualWeight = parseFloat(orderData.physicalWeight) || 0.5; // Default 0.5kg
  const volumetricWeight =
      ((parseFloat(orderData.length) || 10) * (parseFloat(orderData.breadth) || 10) * (parseFloat(orderData.height) || 10)) / 6000; // Default 10x10x10
  const finalWeight = Math.max(actualWeight, volumetricWeight, 0.5); // Minimum 0.5kg charge
 
  let shippingCost = 0;
  if (chargeType === "fixed") { 
      if (finalWeight <= 0.5) shippingCost = baseRatePerKg * 0.5;
      else if (finalWeight <= 1) shippingCost = baseRatePerKg * 1;
      else shippingCost = baseRatePerKg * Math.ceil(finalWeight * 2) / 2; // Round up to next 0.5kg
  } else {
      
       if (finalWeight <= 0.5) shippingCost = baseRatePerKg * 0.5;
       else if (finalWeight <= 1) shippingCost = baseRatePerKg * 1;
       else shippingCost = baseRatePerKg * Math.ceil(finalWeight * 2) / 2;
  }
 
  let codCharge = 0;
  if (orderData.paymentMode === "COD") {
      const codRate = rates?.codChargesAmount ?? 30; // Default ₹30 fixed COD
      const codType = rates?.codChargesType ?? "fixed";
      if (codType === 'fixed') {
          codCharge = codRate;
      } else { 
          codCharge = (parseFloat(orderData.orderValue) || 0) * (codRate / 100);
          codCharge = Math.max(codCharge, 30);
      }
  }

  console.log(`Calculated Shipping Cost: ${shippingCost}, COD Charge: ${codCharge}, Final Weight: ${finalWeight}`);
  return Math.round((shippingCost + codCharge) * 100) / 100;  
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

        // --- Calculate Shipping Cost BEFORE creating order (or after, see note below) ---
        let calculatedShippingCharge = 0;
        if (data.paymentMode === "Prepaid") { 
            calculatedShippingCharge = await calculateShippingCost(data);
            if (isNaN(calculatedShippingCharge) || calculatedShippingCharge <= 0) {
                return NextResponse.json({ error: "Could not calculate shipping cost for prepaid order" }, { status: 400 });
            }
            const wallet = await prisma.wallet.findUnique({
                where: { userId: decoded.userId },
            });
            const currentBalance = wallet?.balance ?? 0;

            if (currentBalance < calculatedShippingCharge) {
                return NextResponse.json({ error: `Insufficient wallet balance for prepaid shipping. Required: ₹${calculatedShippingCharge.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}` }, { status: 402 }); // 402 Payment Required
            }
        } else if (data.paymentMode === "COD") { 
            console.log("COD Order: Skipping wallet balance check and deduction.");
        } else {
            return NextResponse.json({ error: "Invalid payment mode specified" }, { status: 400 });
        }


        const order = await prisma.order.create({
            data: {
                ...data,
                userId: decoded.userId,
                // ensure numeric fields are converted if necessary
                quantity: parseInt(data.quantity) || 1,
                orderValue: parseFloat(data.orderValue) || 0,
                codAmount: data.paymentMode === "COD" ? (parseFloat(data.codAmount) || 0) : null, // Only set COD amount if paymentMode is COD
                physicalWeight: parseFloat(data.physicalWeight) || 0,
                length: parseFloat(data.length) || 0,
                breadth: parseFloat(data.breadth) || 0,
                height: parseFloat(data.height) || 0,
                orderDate: data.orderDate ? new Date(data.orderDate) : new Date(), // Ensure date is valid 
            }
        });

        if (data.paymentMode === "Prepaid") { 
            const updatedWallet = await prisma.wallet.update({
                where: { userId: decoded.userId },
                data: { balance: { decrement: calculatedShippingCharge } },
            });
   
            await prisma.transaction.create({
                data: {
                    userId: decoded.userId,
                    amount: calculatedShippingCharge, 
                    type: "debit",
                    status: "Success",
                    orderId: order.id,
                },
            });
            console.log(`Prepaid Order ${order.id} created. Deducted ₹${calculatedShippingCharge}. New balance: ₹${updatedWallet.balance.toFixed(2)}`);
        } else {
             console.log(`COD Order ${order.id} created. No wallet deduction.`);
        }

        return NextResponse.json(order, { status: 201 });
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
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}


 