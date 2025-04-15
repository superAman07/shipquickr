import DashboardSidebar from "@/components/dashboard-sidebar"
import DashboardHorizontalNav from "@/components/DashboardHorizontalNav"
import Navbar from "@/components/NavBar"
import RateCalculator from "@/components/rate-calculator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { jwtDecode } from "jwt-decode"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"  
interface TokenDetailsType {
  userId: string,
  firstName: string,
  email: string,
  role: string,
}

export default async function Dashboard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token =cookieStore.get("token")?.value
  console.log("Token on server:", token)
 
  
  if (!token) {
    console.log("Token not found, redirecting...")
    redirect("/user/auth/login")
  }
  
  const decoded = jwtDecode<{ exp: number } & TokenDetailsType>(token);
  const isExpired = decoded.exp * 1000 < Date.now(); 
  if (isExpired) {
    console.log("Token expired, redirecting...");
    redirect("/user/auth/login");
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Navbar />
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <aside className="sticky top-0 h-screen z-30">
          <DashboardSidebar />
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center px-4 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Dashboard</h1>
            <div className="flex items-center space-x-4 ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <DashboardHorizontalNav />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
