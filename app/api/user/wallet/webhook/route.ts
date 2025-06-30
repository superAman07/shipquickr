import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try { 
        const webhookUser = req.headers.get("x-username");
        const webhookPass = req.headers.get("x-password");

        if (
            webhookUser !== process.env.PHONEPE_WEBHOOK_USER ||
            webhookPass !== process.env.PHONEPE_WEBHOOK_PASS
        ) {
            console.error("PhonePe Webhook: Invalid credentials received.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
 
        const event = await req.json();
        console.log("PhonePe Webhook Event Received:", JSON.stringify(event, null, 2));
 
        // Handle successful payment
        if (event.code === "pg.order.completed") {
            const { merchantTransactionId, providerReferenceId, amount } = event.data;
            const paymentAmount = amount / 100;

            if (!merchantTransactionId) {
                console.error("PhonePe Webhook: merchantTransactionId is missing from COMPLETED payload.");
                return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
            }
    
            await prisma.$transaction(async (tx) => { 
                const pendingTransaction = await tx.transaction.findUnique({
                    where: { merchantTransactionId: merchantTransactionId },
                });

                if (!pendingTransaction) {
                    throw new Error(`Transaction not found for merchantTransactionId: ${merchantTransactionId}`);
                }
    
                if (pendingTransaction.status === "Success") {
                    console.log(`PhonePe Webhook: Transaction ${merchantTransactionId} already marked as Success. Ignoring duplicate event.`);
                    return;
                }
                
                await tx.wallet.update({
                    where: { userId: pendingTransaction.userId },
                    data: { balance: { increment: paymentAmount } },
                });
    
                await tx.transaction.update({
                    where: { id: pendingTransaction.id },
                    data: {
                        status: "Success",
                        providerReferenceId: providerReferenceId,
                        remarks: "Wallet recharge successful via PhonePe."
                    },
                });
            });

            console.log(`Successfully processed wallet recharge for merchantTransactionId: ${merchantTransactionId}`);

        // Handle failed payment
        } else if (event.code === "pg.order.failed") {
            const { merchantTransactionId, providerReferenceId } = event.data;
            if (!merchantTransactionId) {
                console.error("PhonePe Webhook: merchantTransactionId is missing from FAILED payload.");
                return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
            }

            await prisma.transaction.updateMany({
                where: { merchantTransactionId: merchantTransactionId, status: "Pending" },
                data: {
                    status: "Failed",
                    providerReferenceId: providerReferenceId,
                    remarks: `Payment failed or was cancelled. Code: ${event.code}`
                }
            });
            console.log(`Marked transaction as Failed for merchantTransactionId: ${merchantTransactionId}`);
        
        // Ignore refund and other events for now
        } else {
            console.log(`PhonePe Webhook: Received unhandled event '${event.code}'. Ignoring.`);
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error("PhonePe Webhook Error:", err);
        return NextResponse.json({ received: true, error: "Internal server error during processing." }, { status: 500 });
    }
}