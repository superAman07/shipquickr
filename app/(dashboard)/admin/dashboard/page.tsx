import LogoutButton from "@/components/logout";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers"; 

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
        throw new Error("Token is undefined");
      }
      const decoded = jwtDecode<{ exp: number } & TokenDetailsType>(token);
  return (
    <div className="p-6 w-full h-full bg-[#252525]">
      <h1 className="text-2xl font-semibold">Welcome {decoded.firstName} Admin Dashboard! this is your email {decoded.email} and role: {decoded.role}</h1>
      <LogoutButton propUser={"admin"}/>
    </div>
  );
}