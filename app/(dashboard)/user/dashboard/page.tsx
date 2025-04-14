import LogoutButton from "@/components/logout"
import { jwtDecode } from "jwt-decode"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

interface TokenDetailsType {
  userId: string,
  firstName: string,
  email: string,
  role: string,
}

export default async function Dashboard() {
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
    <div className="p-6 w-full h-full bg-[#252525]">
      <h1 className="text-2xl font-semibold">Welcome to your Dashboard! {decoded.firstName} your id is {decoded.userId} and your email is {decoded.email} and your role is "{decoded.role}"</h1>
      <LogoutButton />
    </div>
  )
}
