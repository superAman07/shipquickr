import { prisma } from "@/lib/prisma";

interface Wallet {
    userId: number;
    balance: number;
}

interface Transaction {
    userId: number;
    amount: number;
    type: string;
    status: string;
    orderId: number;
}

interface CourierPayable {
    courierName: string;
    amount: number;
    orderId: number;
    status: string;
}

interface TransactionContext {
    wallet: {
        update: (args: { where: { userId: number }; data: { balance: { decrement: number } } }) => Promise<Wallet>;
    };
    transaction: {
        create: (args: { data: Transaction }) => Promise<{ id: number }>;
    };
    courierPayable: {
        create: (args: { data: CourierPayable }) => Promise<void>;
    };
}

export async function processShippingPayment(
    tx: TransactionContext,
    userId: number,
    orderId: number,
    amount: number,
    courier: string
): Promise<{ updatedBalance: number; transactionId: number }> {
    // 1. Deduct from user wallet
    const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
    });

    // 2. Record transaction for user
    const transaction = await tx.transaction.create({
        data: {
            userId,
            amount,
            type: "debit",
            status: "Success",
            orderId,
        }
    });

    // 3. Create courier payable record
    await tx.courierPayable.create({
        data: {
            courierName: courier,
            amount,
            orderId,
            status: "pending",
        }
    });

    return { updatedBalance: updatedWallet.balance, transactionId: transaction.id };
}