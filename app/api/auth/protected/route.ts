import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { userId: string };

    return NextResponse.json({ message: "Authorized", userId: decoded.userId });
  } catch (e) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
