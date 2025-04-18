import type { Metadata } from "next"
import { KycDashboard } from "@/components/kyc-dashboard"
import { ChevronRight, FileCheck, Home } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "KYC Management | Admin Dashboard",
  description: "Review and manage user KYC verification status",
}

interface KycHeaderProps {
  title?: string
  subtitle?: string
}
export default function KycPage({ title = "KYC Management", subtitle="Review and manage user KYC verification status" }: KycHeaderProps) {
  return (
    <div className="flex flex-col  min-h-screen">
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-4 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
      <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 dark:text-amber-50">
            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">{title}</h1>
          </div>

          {subtitle && <p className="text-xs sm:text-sm text-primary-foreground/80 dark:text-amber-50/90">{subtitle}</p>}
        </div>

        <div className="mt-2 flex flex-wrap items-center text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
          <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300 transition-colors">
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            <span>Dashboard</span>
          </Link> 

          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
          <span className="font-medium">KYC</span>
        </div>
      </div>
    </header>

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="bg-card w-full rounded-lg shadow-sm p-4 md:p-6">
          <KycDashboard />
        </div>
      </main>
    </div>
  )
}
