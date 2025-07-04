import DashboardSidebarAdmin from "@/components/dashboard-sidebar-admin" 
import Navbar from "@/components/NavBar" 
import RouteLoadingBar from "@/components/RouteLoadingBar"
import { ThemeProvider } from "@/components/theme-provider" 
import { jwtDecode } from "jwt-decode"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"  
interface TokenDetailsType {
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  role: string,
}

export async function generateMetadata () { 
  const cookiesStore = await cookies();
  const adminToken  = cookiesStore.get("adminToken")?.value; 
  let role = "User";
  try {
    if(adminToken){
      const decoded: any = jwtDecode(adminToken);
      if(decoded.role=== 'admin') role = "Admin";
    }
  }catch {}
  return {
    title: `Dashboard | Shipquickr - ${role} & Dashboard`,
    description: "Generated by create next app",
  }
}

export default async function Dashboard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token =cookieStore.get("adminToken")?.value
  console.log("Token on server for admin:", token)
 
  
  if (!token) {
    console.log("Token not found, redirecting...")
    redirect("/admin/auth/login")
  }
  
  const decoded = jwtDecode<{ exp: number } & TokenDetailsType>(token);
  const isExpired = decoded.exp * 1000 < Date.now(); 
  if (isExpired) {
    console.log("Token expired, redirecting...");
    redirect("/admin/auth/login");
  }

  const fullName = `${decoded.firstName} ${decoded.lastName}`

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      
        <Navbar userRole={decoded.role} userName={fullName}/>
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900 pt-16">
          <aside className="sticky top-16 h-[calc(100vh-4rem)] z-30">
            <DashboardSidebarAdmin />
          </aside>
          <div className="flex-1 flex flex-col overflow-hidden"> 
            <main className="flex-1 p-6 overflow-hidden">
              <RouteLoadingBar />
              {children}
            </main>
          </div> 
        </div> 
    </ThemeProvider>
  )
}
