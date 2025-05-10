"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Info, Calculator, ChevronRight, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/dashboard", icon: <Package className="h-5 w-5" />, label: "Dashboard" }, 
  { href: "/admin/dashboard/users", icon: <Users className="h-5 w-5" />, label: "Users" },
  { href: "/admin/dashboard/kyc", icon: <UserCheck className="h-5 w-5" />, label: "KYC" },
  { href: "/admin/dashboard/rate-calculator", icon: <Calculator className="h-5 w-5" />, label: "Rate Calculator" },
  { href: "/admin/dashboard/shipping-rates", icon: <Truck className="h-5 w-5" />, label: "Shipping Rates" },
];
 
function NavItem({ icon, label, href, active = false, collapsed }: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-4 py-3 mt-3 cursor-pointer rounded-l-full transition-colors",
        active ? "bg-indigo-900" : "hover:bg-indigo-900",
        collapsed ? "justify-center" : ""
      )}
    >
      <div className={cn("flex font-bold items-center", collapsed ? "justify-center" : "")}>
        {icon}
        
        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300",collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-xs")}>
            {label}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardSidebarAdmin() {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setSidebarCollapsed(isMobile);
    };
  
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  return (
    <aside
      className={cn(
        "bg-indigo-950 text-white h-full transition-all duration-300 ease-in-out flex flex-col",
        sidebarCollapsed ? "w-16" : "w-50",
      )}
    > 
    <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        className={cn(
          "absolute z-40 right-[-18px] top-1/2 -translate-y-1/2 bg-indigo-700 text-white border border-indigo-900 shadow-lg rounded-full p-1 transition-transform",
          "hover:bg-indigo-800",
          "backdrop-blur bg-indigo-700/60",
          sidebarCollapsed ? "rotate-180" : ""
        )}
        style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <nav className="flex-1 pt-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-indigo-900">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-white hover:bg-indigo-900"
          onClick={toggleSidebar}
        >
          <ChevronRight className={cn("h-5 w-5 transition-transform", sidebarCollapsed ? "rotate-180" : "")} />
          {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}