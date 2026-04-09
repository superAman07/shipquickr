"use client"
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { AlertCircle, ChevronRight } from "lucide-react";

export function KycAlertBanner() {
  const fetcher = (url: string) => axios.get(url).then((res) => res.data)
  const { data, isLoading } = useSWR("/api/user/kyc", fetcher, { revalidateOnFocus: false })

  if (isLoading || data?.kycStatus === "approved") return null

  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-xl mb-4 px-4 py-3 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-2">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <span className="text-[13px] sm:text-sm text-red-900 font-medium">
          ⚠️ Complete your KYC to start shipping orders seamlessly.
        </span>
      </div>
      <Link href="/user/dashboard/kyc" className="shrink-0 w-full sm:w-auto group flex items-center justify-center gap-1 text-sm font-bold text-red-700 bg-white sm:bg-transparent border sm:border-transparent border-red-200 px-4 py-1.5 sm:p-0 rounded-lg sm:rounded-none hover:text-red-800 transition-colors">
        Complete KYC Now
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
