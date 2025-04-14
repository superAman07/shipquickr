"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!")
      return
    }

    try { 
      const response = await axios.post("/api/auth/signup",formData) 
      if (response.status===201) {
        alert("Signup successful! Please sign in.")
        router.push("/user/auth/login")
      } else {
        alert(response.data.message || "Signup failed. Please try again.")
      }
    } catch (error) {
      console.error("Error during signup:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] rounded-full bg-blue-400/20 -left-24 -top-24 animate-pulse"></div>
      <div className="absolute w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] rounded-full bg-indigo-500/20 right-0 bottom-0 animate-pulse delay-700"></div>

        <div className="w-full md:w-7/12 rounded-r-2xl bg-white p-6 sm:p-8">
        <div className="flex justify-center mb-4 sm:mb-6">
            <div className="flex items-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 transform rotate-45"></div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-400 transform rotate-45 -ml-4 mt-4"></div>
            <h1 className="text-blue-900 font-bold text-xl sm:text-2xl ml-2">SHIPQUICKR</h1>
            </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-6 sm:mb-8">Change Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 text-[#252525]">
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
                <label htmlFor="firstName" className="block text-gray-700 text-sm font-medium mb-1">
                First Name <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter First Name"
                />
            </div>
            <div className="w-full sm:w-1/2">
                <label htmlFor="lastName" className="block text-gray-700 text-sm font-medium mb-1">
                Last Name <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter Last Name"
                />
            </div>
            </div>

            <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
            </label>
            <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter Email Id"
            />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
                Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter password"
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                </div>
            </div>
            <div className="w-full sm:w-1/2">
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1">
                Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter password"
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                </div>
            </div>
            </div>

            <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2.5 sm:py-3 rounded-full hover:bg-blue-600 transition-colors font-semibold text-base sm:text-lg mt-2 focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
            >
            SIGN UP
            </button>
        </form>

        <p className="text-center mt-4 sm:mt-6 text-gray-600 text-sm sm:text-base">
            Already have an account?{" "}
            <Link
            href="/user/auth/login"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
            >
            Log In
            </Link>
        </p>
        </div>
    </div> 
  )
}
