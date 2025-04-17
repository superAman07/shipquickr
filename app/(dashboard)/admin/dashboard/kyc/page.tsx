import type { Metadata } from "next"
import { KycDashboard } from "@/components/kyc-dashboard"

export const metadata: Metadata = {
  title: "KYC Management | Admin Dashboard",
  description: "Review and manage user KYC verification status",
}

export default function KycPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Kyc</h1>
          <div className="text-sm breadcrumbs">
            <ul>
              <li>Dashboard</li>
              <li>Kyc</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
          <KycDashboard />
        </div>
      </main>
    </div>
  )
}
