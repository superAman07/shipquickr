import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
 
interface TokenDetailsType {
  userId: string;  
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get("userToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token found" }, { status: 401 });
    }

    let decoded: TokenDetailsType;
    try {
      decoded = jwtDecode<TokenDetailsType>(token);
    } catch (error) {
      console.error("Token decoding failed:", error); 
      const response = NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
      response.cookies.set("userToken", "", { maxAge: 0, path: "/" });
      return response;
    }
 
    if (decoded.exp * 1000 < Date.now()) {
      const response = NextResponse.json({ error: "Unauthorized: Token expired" }, { status: 401 });
      response.cookies.set("userToken", "", { maxAge: 0, path: "/" });
      return response;
    }
 
    const userDetails = {
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email, 
    };

    return NextResponse.json(userDetails, { status: 200 });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}