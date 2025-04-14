import { jwtDecode } from "jwt-decode"
import { cookies } from "next/headers"
import { redirect } from "next/navigation" 

interface TokenDetailsType {
  userId: string,
  firstName: string,
  email: string,
  role: string,
}

export default async function Dashboard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token =cookieStore.get("token")?.value
  console.log("Token on server:", token)
 
  
  if (!token) {
    console.log("Token not found, redirecting...")
    redirect("/user/auth/login")
  }
  
  const decoded = jwtDecode<{ exp: number } & TokenDetailsType>(token);
  const isExpired = decoded.exp * 1000 < Date.now(); 
  if (isExpired) {
    console.log("Token expired, redirecting...");
    redirect("/user/auth/login");
  }
 
  return (
    <>{children}</>
  )
}
