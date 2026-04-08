import type { Metadata } from "next"
import { ChevronRight, FileCheck, Home } from "lucide-react"
import Link from "next/link"

import { UsersInAdminDashboard } from "@/components/users-in-admin-dashboard"

export const metadata: Metadata = {
  title: "KYC Management | Admin Dashboard",
  description: "Review and manage user KYC verification status",
}

export default function KycPage() {
  const title = "User Management"
  const subtitle = "Review and manage user status"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-600" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {title}
            </h1>
          </div>

          {subtitle && (
            <div className="hidden border-l border-slate-200 pl-4 dark:border-slate-700 sm:block">
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          )}
        </div>

        {/* Breadcrumbs on the right */}
        <div className="hidden items-center text-xs text-muted-foreground md:flex">
          <Link
            href="/admin/dashboard"
            className="flex items-center transition-colors hover:text-indigo-600"
          >
            <Home className="mr-1 h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>

          <ChevronRight className="mx-1 h-3.5 w-3.5 opacity-50" />

          <span className="font-medium text-slate-900 dark:text-slate-100">Users</span>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 md:p-6">
        <div className="bg-card w-full rounded-lg p-4 shadow-sm md:p-6">
          <UsersInAdminDashboard />
        </div>
      </main>
    </div>
  )
}