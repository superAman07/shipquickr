"use client";

import { Banknote, Clock, Zap, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

export default function CodPlans() {
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    setNotified(true);
    toast.success("We'll notify you when COD Plans go live!");
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-lg">
      {/* Breadcrumb */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          COD Plans
        </h1>

        <div className="flex items-center text-sm">
          <Link
            href="/user/dashboard"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-blue-600 dark:text-blue-400">COD Plans</span>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 rounded-2xl shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 px-6 py-16 md:py-24 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 text-amber-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            COMING SOON
          </div>

          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Banknote className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-amber-900" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 max-w-lg leading-tight">
            Daily COD Remittance Plans
          </h2>

          <p className="text-gray-300 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
            We&apos;re building something powerful, choose your remittance
            cycle, minimize cash flow delays, and grow your business faster with
            early COD payouts.
          </p>

          {/* Notify Button */}
          <button
            onClick={handleNotify}
            disabled={notified}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
              notified
                ? "bg-green-500/20 text-green-300 border border-green-500/30 cursor-default"
                : "bg-white text-indigo-950 hover:bg-gray-100 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <Bell className={`w-4 h-4 ${notified ? "" : "animate-bounce"}`} />
            {notified ? "You'll be Notified!" : "Notify Me When It's Live"}
          </button>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1.5">
            Faster Remittance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Get your COD payouts as early as D + 1 after delivery. No more
            waiting weeks for your money.
          </p>
        </div>

        <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-purple-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1.5">
            Flexible Plans
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Choose a plan that fits your business needs, from daily payouts to
            weekly cycles at competitive rates.
          </p>
        </div>

        <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-green-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1.5">
            Grow Faster
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Reinvest your COD collections quickly and scale your operations
            without cash flow bottlenecks.
          </p>
        </div>
      </div>
    </div>
  );
}