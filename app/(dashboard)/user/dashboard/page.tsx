import LogoutButton from "@/components/logout"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const cookieStore = await cookies()
  const token =cookieStore.get("token")?.value
  console.log("Token on server:", token)


  if (!token) {
    console.log("Token not found, redirecting...")
    redirect("/auth/signin")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Welcome to your Dashboard!</h1>
      <LogoutButton />
    </div>
  )
}
