"use client"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react" 
import ButtonLoading from "./buttonLoading";
import { cn } from "@/lib/utils";

interface Styling{
  color?: string;
}

export default function LogoutButton({propUser,propStyle, className}:{ propUser: string; propStyle?:Styling; className?: string }) {
  const [loading,setLoading] = useState(false);
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      const res = await axios.post("/api/auth/logout",{ userType: propUser })
      if (res.status === 200) {
        router.push(`/${propUser}/auth/login`)
      }
    } catch (err) {
      console.error("Logout failed", err)
    }finally {
      setLoading(false);  
    }
  } 

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLogout}
      className={cn(
        "px-[1px] py-2 w-full cursor-pointer text-left", 
        propStyle?.color || "text-white",
        "disabled:opacity-50",
        className 
      )}
    >
      {loading ? <ButtonLoading name="Logging out..."/>:"Logout"}
    </button>
  )
}
