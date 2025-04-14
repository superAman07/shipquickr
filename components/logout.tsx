"use client"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await axios.get("/api/auth/logout")
      if (res.status === 200) {
        router.push("/user/auth/signin")
      }
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

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
