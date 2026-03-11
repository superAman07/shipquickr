import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch currently assigned couriers for a user
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const assignments = await prisma.userCourierAssignment.findMany({
            where: { 
                userId,
                isActive: true 
            },
            select: { courier: true }
        });

        // Map it to just an array of strings e.g., ["Delhivery Surface", "Delhivery Express"]
        const enabledCouriers = assignments.map(a => a.courier);

        return NextResponse.json({ couriers: enabledCouriers });

    } catch (error) {
        console.error("Error fetching user couriers:", error);
        return NextResponse.json({ error: "Failed to fetch couriers" }, { status: 500 });
    }
}

// POST: Update assigned couriers for a user (Admin sends an array of enabled ones)
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const body = await req.json();
        const enabledCouriers: string[] = body.couriers; // e.g. ["Delhivery Surface"]

        if (!Array.isArray(enabledCouriers)) {
            return NextResponse.json({ error: "Invalid payload format. Expected an array of couriers." }, { status: 400 });
        }

        // We will execute this in a transaction to make it atomic
        await prisma.$transaction(async (tx) => {
            // First, set ALL existing assignments for this user to false
            await tx.userCourierAssignment.updateMany({
                where: { userId },
                data: { isActive: false }
            });

            // Now, upsert the enabled ones to True
            for (const courierName of enabledCouriers) {
                await tx.userCourierAssignment.upsert({
                    where: {
                        userId_courier: {
                            userId,
                            courier: courierName
                        }
                    },
                    update: {
                        isActive: true
                    },
                    create: {
                        userId,
                        courier: courierName,
                        isActive: true
                    }
                });
            }
        });

        return NextResponse.json({ message: "Courier assignments updated successfully" });

    } catch (error) {
        console.error("Error updating user couriers:", error);
        return NextResponse.json({ error: "Failed to update couriers" }, { status: 500 });
    }
}