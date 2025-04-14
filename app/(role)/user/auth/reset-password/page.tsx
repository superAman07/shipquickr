"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import ButtonLoading from "@/components/buttonLoading";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!token) {
      alert("Invalid or missing token");
      router.push("/user/auth/login");
    }
  }, [token, router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
      setTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const res = await axios.post("/api/auth/reset-password", { token, password }, {
        headers: { "Content-Type": "application/json" },
      });
      alert(res.data.message);
      router.push("/user/auth/login");
    } catch (error: any) {
      const message = error.response?.data?.message || "Something went wrong";
      alert(message);
    }finally {
      setLoading(false); 
    }
  };
  const isPasswordMatch = password === confirmPassword && password.length > 7;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Reset Your Password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password below to reset your account password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-[#252525] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm new password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                required
                className="w-full text-[#252525] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {touched && !isPasswordMatch && (
            <p className="text-sm text-red-500">Passwords do not match or password lenght might less than 8</p>
          )}
          <button
            type="submit"
            disabled={!isPasswordMatch || loading}
            className={`w-full flex items-center justify-center bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-base sm:text-lg focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 ${
              !isPasswordMatch || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                <span>Resetting...</span>
              </div>
            ) : (
              "Reset Password"
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
