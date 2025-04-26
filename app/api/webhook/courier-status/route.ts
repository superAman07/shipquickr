import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // TODO: implement courier‑status webhook handling
  return NextResponse.json({ received: true });
}