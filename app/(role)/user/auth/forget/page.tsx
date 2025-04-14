"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; 
import ButtonLoading from "@/components/buttonLoading";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
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
  );
}