"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resSend = await axios.post("/api/auth/forget-password", { email }, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("this is sended response: ",resSend)
      alert("If the email exists, a reset link has been sent."); 
      router.push("/user/auth/login");
    } catch (error: any) {
      const message = error.response?.data?.message || "Something went wrong";
      alert(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2>Forgot Your Password?</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
