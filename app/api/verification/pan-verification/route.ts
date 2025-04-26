import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { pan } = await req.json();
  const response = await axios.post(
    "https://sandbox.cashfree.com/verification/pan",
    { pan },
    {
      headers: {
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
    }
  );
  return NextResponse.json(response.data);
}