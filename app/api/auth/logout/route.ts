// import { NextResponse } from "next/server";

// export async function GET() {
//   const response = NextResponse.json({ message: "Logged out" });
//   response.cookies.set("token", "", { maxAge: 0, path: "/",sameSite: "strict" });
//   return response;
// }

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userType } = await req.json();

    const cookieName = userType === "admin" ? "adminToken" : "userToken";

    const response = NextResponse.json({ message: "Logged out successfully" });

    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Error during logout" }, { status: 500 });
  }
}
