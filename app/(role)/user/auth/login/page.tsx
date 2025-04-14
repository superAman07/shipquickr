"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false) 
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  const handleClick = async (e: React.FormEvent)=>{
    e.preventDefault();
    try {
      console.log('Email:', email);
      console.log('Password:', password);
      const response = await axios.post('/api/auth/login', { email, password });
      alert(response.data.message); 
      router.push('/user/dashboard');

    } catch (error:any) {
      const message = error.response?.data?.message || "Something went wrong";
      alert(message);
    }
  } 
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] rounded-full bg-blue-400/20 -left-24 -top-24 animate-pulse"></div>
      <div className="absolute w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] rounded-full bg-indigo-500/20 right-0 bottom-0 animate-pulse delay-1000"></div>

        <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-l-2xl overflow-x-visible shadow-2xl backdrop-blur-sm bg-white/5">
          <div className="w-full md:w-5/12 backdrop-blur-3xl p-6 rounded-l-2xl sm:p-8 text-white relative overflow-x-visible">
            <div className="col-lg-5 col-md-5 col-12 auth-left-side d-flex justify-center center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 md:mb-10 mt-2 md:mt-4">
                Start Shipping Today with 3 Simple Steps!
              </h2>

              <div className="space-y-6 md:space-y-8">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-indigo-900 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">KYC Verification</h3>
                    <p className="text-blue-100 text-sm sm:text-base">It takes only 30 secs to complete</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-indigo-900 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">Recharge Your Wallet</h3>
                    <p className="text-blue-100 text-sm sm:text-base">Add Credits and start shipping today</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-indigo-900 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">Place Your Order</h3>
                    <p className="text-blue-100 text-sm sm:text-base">Create your order with 3 steps</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block absolute bottom-4 lg:-bottom-9 z-20 lg:left-[-105px] ">
              <Image
                src="/card-image.png?height=125&width=125"
                alt="Delivery Person"
                width={200}
                height={200}
                className="w-[150px] h-[300px] "
              />
            </div>

            <div className="absolute top-0 right-0 w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 rounded-full bg-blue-500 opacity-20 -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-56 sm:w-64 md:w-80 h-56 sm:h-64 md:h-80 rounded-full bg-indigo-800 opacity-20 -ml-28 -mb-28"></div>
          </div>

          <div className="w-full md:w-7/12 rounded-r-2xl bg-white p-6 sm:p-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 transform rotate-45"></div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-400 transform rotate-45 -ml-4 mt-4"></div>
                <h1 className="text-blue-900 font-bold text-xl sm:text-2xl ml-2">SHIPQUICKR</h1>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-6 sm:mb-8">Sign In</h2>

            <form onSubmit={handleClick} className="space-y-4 sm:space-y-6 px-10 text-[#252525]">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e)=>{setEmail(e.target.value)}}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your email id"
                />
              </div>
 
              <div className="w-full ">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e)=>{setPassword(e.target.value)}}
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
                <Link href={'/user/auth/forget'} className="text-[#28259d] flex justify-end center h-[0px]">Forgot password?</Link>
              </div> 

              <button 
                type="submit"
                className="w-full bg-blue-500 text-white py-2.5 sm:py-3 rounded-full hover:bg-blue-600 transition-colors font-semibold text-base sm:text-lg mt-2 focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
              >
                SIGN IN
              </button>
            </form>

            <p className="text-center mt-4 sm:mt-6 text-gray-600 text-sm sm:text-base">
              Don't have an account?{" "}
              <Link
                href="/user/auth/signup"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
      </div>
    </div>
  )
}
