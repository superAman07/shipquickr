"use client"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Loading from "./loading";

export default function LogoutButton() {
  const [loading,setLoading] = useState(false);
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/auth/logout")
      if (res.status === 200) {
        router.push("/user/auth/login")
      }
    } catch (err) {
      console.error("Logout failed", err)
    }finally {
      setLoading(false); // Stop loading
    }
  }
  if(loading)return <Loading/>

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Logout
    </button>
  )
}
