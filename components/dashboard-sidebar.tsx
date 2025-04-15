"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Info, Calculator, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";

const navItems = [
  { href: "/user/dashboard", icon: <Package className="h-5 w-5" />, label: "Dashboard" },
  { href: "/user/dashboard/orders", icon: <Truck className="h-5 w-5" />, label: "Orders" },
  { href: "/user/dashboard/reports", icon: <Info className="h-5 w-5" />, label: "Reports" },
  { href: "/user/dashboard/rate-calculator", icon: <Calculator className="h-5 w-5" />, label: "Rate Calculator" },
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
        "flex items-center px-4 py-3 cursor-pointer rounded-l-full transition-colors",
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

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  return (
    <aside
      className={cn(
        "bg-indigo-950 text-white h-full transition-all duration-300 ease-in-out flex flex-col",
        sidebarCollapsed ? "w-16" : "w-50",
      )}
    >
      <div className="flex items-center p-4 h-16 border-b border-indigo-900">
        {!sidebarCollapsed && <span className="text-xl font-bold text-white">ShipQuickr</span>}
        {sidebarCollapsed && <span className="text-xl font-bold mx-auto">SQ</span>}
      </div>
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