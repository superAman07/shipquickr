"use client"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react" 
import ButtonLoading from "./buttonLoading";


export default function LogoutButton({propUser}:{ propUser: string}) {
  const [loading,setLoading] = useState(false);
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/auth/logout")
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
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      {loading ? <ButtonLoading name="Logging out..."/>:"Logout"}
    </button>
  )
}
