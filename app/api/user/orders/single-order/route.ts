import { prisma } from "@/lib/prisma";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ecomExpressClient } from "@/lib/services/ecom-express";

interface TokenDetailsType {
    userId: number;
    exp: number;
}

async function calculateShippingCost(orderData: any): Promise<number> { 
  const rates = await prisma.shippingRates.findFirst({ orderBy: { createdAt: "desc" } });
  const baseRatePerKg = rates?.courierChargesAmount ?? 50; 
  const chargeType = rates?.courierChargesType ?? "fixed";  
 
  const actualWeight = parseFloat(orderData.physicalWeight) || 0.5; 
  const volumetricWeight =
      ((parseFloat(orderData.length) || 10) * (parseFloat(orderData.breadth) || 10) * (parseFloat(orderData.height) || 10)) / 6000; // Default 10x10x10
  const finalWeight = Math.max(actualWeight, volumetricWeight, 0.5);  
 
  let shippingCost = 0;
  if (chargeType === "fixed") { 
      if (finalWeight <= 0.5) shippingCost = baseRatePerKg * 0.5;
      else if (finalWeight <= 1) shippingCost = baseRatePerKg * 1;
      else shippingCost = baseRatePerKg * Math.ceil(finalWeight * 2) / 2; 
  } else {
      
       if (finalWeight <= 0.5) shippingCost = baseRatePerKg * 0.5;
       else if (finalWeight <= 1) shippingCost = baseRatePerKg * 1;
       else shippingCost = baseRatePerKg * Math.ceil(finalWeight * 2) / 2;
  }
 
  let codCharge = 0;
  if (orderData.paymentMode === "COD") {
      const codRate = rates?.codChargesAmount ?? 30;  
      const codType = rates?.codChargesType ?? "fixed";
      const orderTotalValueForCod = parseFloat(orderData.codAmount) || 0;
      if (codType === 'fixed') {
          codCharge = codRate;
      } else { 
          codCharge = (orderTotalValueForCod * (codRate / 100));
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

        let calculatedShippingCharge = 0;
        if (data.paymentMode === "Prepaid") { 
            calculatedShippingCharge = await calculateShippingCost({...data,codAmount: 0});
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
            if (data.codAmount === undefined || data.codAmount === null || isNaN(Number(data.codAmount)) || Number(data.codAmount) < 0) {
              return NextResponse.json({ error: "Valid COD Amount is required for COD orders." }, { status: 400 });
            }
            console.log("COD Order: Skipping wallet balance check and deduction.");
        } else {
            return NextResponse.json({ error: "Invalid payment mode specified" }, { status: 400 });
        }

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
 
          let updatedWallet;
          if (data.paymentMode === "Prepaid" && calculatedShippingCharge > 0) {
              updatedWallet = await tx.wallet.update({
                  where: { userId: decoded.userId },
                  data: { balance: { decrement: calculatedShippingCharge } },
              });

              await tx.transaction.create({
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

        //

        try { 
            const warehouse = await tx.warehouse.findFirst({
              where: { 
                warehouseName: data.pickupLocation,
                userId: decoded.userId
              }
            });
            if (!warehouse) {
              throw new Error(`Pickup location warehouse '${data.pickupLocation}' not found for user.`);
            }
            const itemNames = data.items.map((item: any) => `${item.productName}(${item.quantity})`).join(', ');
            const totalQuantity = data.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
            const ecomShipment = {
                pickup_location: {
                    name: data.pickupLocation,
                    pin: data.pickupPincode || "",
                    address: warehouse?.address1 || "",
                    phone: warehouse?.mobile || "",
                    city: warehouse?.city || "", 
                    state: warehouse?.state || "",
                  },
              shipments: [{
                item_name: data.productName.substring(0,100),
                order_id: data.orderId,
                payment_mode: data.paymentMode === "COD" ? "COD" : "PPD", 
                customer: {
                  name: data.customerName,
                  address: data.address,
                  pin: data.pincode,
                  phone: data.mobile,
                  city: data.city,
                  state: data.state,
                },
                dimensions: {
                  length: parseFloat(data.length) || 10,
                  breadth: parseFloat(data.breadth) || 10,
                  height: parseFloat(data.height) || 10,
                  weight: parseFloat(data.physicalWeight) || 0.5,
                },
                cod_amount: data.paymentMode === "COD" ? (parseFloat(data.codAmount)||0) : 0,
              }]
            };

            console.log("Calling Ecom Express API with:", JSON.stringify(ecomShipment));

            const ecomResponse = await ecomExpressClient.generateAWB(ecomShipment);
             
            console.log("Ecom Express Response:", JSON.stringify(ecomResponse));

            if (ecomResponse?.awb_number) {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  awbNumber: ecomResponse.awb_number,
                  courierName: "Ecom Express",
                  status: "shipped", 
                  shippingDetails: `Shipped via Ecom Express on ${new Date().toLocaleString()}`,
                }
              });
            }else {
              console.warn(`AWB generation failed for Order ID ${order.id}. Order saved as 'unshipped'. Response: ${JSON.stringify(ecomResponse)}`);
            }
          } catch (ecomError:any) {
            console.error(`Failed to generate AWB for Order ID ${order.id}:`, ecomError);
          }

        return { ...order, items: orderItemsData, newBalance: updatedWallet?.balance };  
      });  
      return NextResponse.json(result, { status: 201 });
    }catch (error: any) {
      console.error("Error creating single order:", error);
      if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) { // More specific check for unique constraint on orderId
        return NextResponse.json({ error: "This Order ID already exists. Please use a unique Order ID." }, { status: 409 });
      } 
      if (error.message.startsWith("AWB generation failed") || error.message.startsWith("Pickup location warehouse")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
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


 