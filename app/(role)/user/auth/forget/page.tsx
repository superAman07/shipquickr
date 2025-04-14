"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; 
import ButtonLoading from "@/components/buttonLoading";
import Image from "next/image";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resSend = await axios.post("/api/auth/forget-password", { email }, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("this is sended response: ", resSend);
      alert("If the email exists, a reset link has been sent.");
      router.push("/user/auth/login");
    } catch (error: any) {
      const message = error.response?.data?.message || "Something went wrong";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

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
                src="/forgot-boy.png?height=125&width=125"
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

            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Forgot Your Password?
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Enter your email address below and we’ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-base sm:text-lg focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {loading ? (
                    <ButtonLoading name={"Sending..."}/>
                  ) : (
                    "Send Reset Link"
                  )}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-6">
              Remembered your password?{" "}
              <a
                href="/user/auth/login"
                className="text-blue-500 hover:underline"
              >
                Log In
              </a>
            </p>
        </div>
      </div>
    </div>
  );
}