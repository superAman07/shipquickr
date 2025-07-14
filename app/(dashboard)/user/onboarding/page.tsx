"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Truck, Package, Phone, TrendingUp, Shield, Clock, Users, Globe, Award } from 'lucide-react';

export default function UserOnboarding() {
  const [mobile, setMobile] = useState("");
  const [shipments, setShipments] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/user/profile").catch((err) => {
      if (err.response?.status === 401) {
        router.replace("/user/auth/login");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/user/onboarding", {
        mobile,
        shipments,
      });
      router.push("/user/dashboard");
    } catch (err) {
      alert("Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };
   return (
    <div className="h-screen w-screen overflow-hidden relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-blue-800/90 to-blue-600/95"></div>
      </div>

      <div className="relative z-10 h-full flex"> 
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 xl:px-12">
          <div className="max-w-lg">
            <div className="flex items-center mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mr-3 border border-white/20">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-white">ShipQuickr</h1>
                <p className="text-blue-200 text-xs xl:text-sm">Professional Shipping Solutions</p>
              </div>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Shipping Experience
              </span>
            </h2>
            
            <p className="text-base xl:text-lg text-blue-100 mb-8 leading-relaxed">
              Join over 10,000+ businesses worldwide who trust ShipQuickr for seamless, 
              reliable, and intelligent shipping solutions.
            </p>

            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg p-2 mr-3 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  <Clock className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">Lightning Fast Delivery</h3>
                  <p className="text-blue-200 text-xs xl:text-sm leading-relaxed">Same-day, next-day delivery with real-time tracking</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg p-2 mr-3 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  <Shield className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">100% Secure & Insured</h3>
                  <p className="text-blue-200 text-xs xl:text-sm leading-relaxed">Complete package protection with 24/7 support</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-2 mr-3 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  <TrendingUp className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">Smart Analytics Dashboard</h3>
                  <p className="text-blue-200 text-xs xl:text-sm leading-relaxed">Advanced insights and cost optimization</p>
                </div>
              </div>
            </div>
 
            <div className="flex items-center space-x-6 text-blue-200">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1 text-blue-300" />
                <span className="text-xs font-medium">10,000+ Businesses</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1 text-blue-300" />
                <span className="text-xs font-medium">500+ Cities</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-1 text-blue-300" />
                <span className="text-xs font-medium">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
 
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 mr-2 border border-white/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ShipQuickr</h1>
                <p className="text-blue-200 text-xs">Professional Shipping</p>
              </div>
            </div>
 
            <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Welcome to ShipQuickr!
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Enter your details to continue and unlock your personalized shipping dashboard.
                  </p>
                </div>
 
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                      <Phone className="w-3 h-3 mr-1 text-blue-600" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      required
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50/80 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all duration-300 placeholder-gray-400 text-sm"
                      placeholder="Enter 10-digit mobile number"
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      For delivery updates and account security
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                      <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                      Average Monthly Shipments
                    </label>
                    <select
                      value={shipments}
                      onChange={e => setShipments(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50/80 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all duration-300 text-sm"
                    >
                      <option value="">Select shipment range</option>
                      <option value="1-10">1-10 shipments</option>
                      <option value="11-50">11-50 shipments</option>
                      <option value="51-100">51-100 shipments</option>
                      <option value="101-500">101-500 shipments</option>
                      <option value="501-1000">501-1000 shipments</option>
                      <option value="1000+">1000+ shipments</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Package className="w-3 h-3 mr-1" />
                      Helps us recommend the best plans
                    </p>
                  </div>
 
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md text-sm"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>Continue</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </button>
                </form>
 
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-green-100 rounded-full p-1.5 mb-1">
                        <Shield className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">SSL Secured</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-100 rounded-full p-1.5 mb-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">2 Min Setup</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-purple-100 rounded-full p-1.5 mb-1">
                        <Award className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Free Forever</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
 
            <div className="lg:hidden mt-6 space-y-3">
              <div className="flex items-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                <Clock className="w-4 h-4 mr-2 text-blue-300 flex-shrink-0" />
                <span className="text-xs">Lightning fast delivery across 500+ cities</span>
              </div>
              <div className="flex items-center text-white/90 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                <Shield className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                <span className="text-xs">100% package protection with instant claims</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}