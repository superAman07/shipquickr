"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Info, Calculator, ChevronRight, Ticket, Users, UserCheck, Plus, ListFilter, User, Newspaper, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import React, { useEffect, useState } from "react";
import LogoutButton from "./logout";

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
        active ? "bg-[#f3f4f6]" : "hover:bg-indigo-900",
        collapsed ? "justify-center" : ""
      )}
    >
      <div className={cn("flex font-bold items-center w-full", collapsed ? "justify-center" : "")}>
        <div className={cn("flex-shrink-0", active ? "text-[#252525]" : "text-[#f3f4f6]")}>
          {React.isValidElement(icon)
            ? React.cloneElement(
              icon as React.ReactElement<{ className?: string }>,
              {
                className: cn(
                  (icon.props as { className?: string }).className,
                  "h-5 w-5",
                  active ? "text-[#252525]" : "text-[#f3f4f6]"
                )
              }
            )
            : icon}
        </div>
        <span
          className={cn(
            "ml-3 whitespace-nowrap transition-all duration-300 w-full",
            collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
            active ? "text-[#252525]" : "text-[#f3f4f6]"
          )}
        >
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
        "bg-[#0a0c37] text-[#f3f4f6] h-full transition-all duration-300 ease-in-out flex flex-col",
        sidebarCollapsed ? "w-16" : "w-50",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        className={cn(
          "absolute z-40 cursor-pointer right-[-18px] top-1/2 -translate-y-1/2 bg-indigo-700 text-[#f3f4f6] border border-indigo-900 shadow-lg rounded-full p-1 transition-transform",
          "hover:bg-indigo-800",
          "backdrop-blur bg-indigo-700/60",
          sidebarCollapsed ? "rotate-180" : ""
        )}
        style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <nav className="flex-1 pt-3 overflow-y-auto hide-scrollbar">
        <NavItem
          icon={<Package className="h-5 w-5" />}
          label="Dashboard"
          href="/admin/dashboard"
          active={pathname === "/admin/dashboard"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Users className="h-5 w-5" />}
          label="Users"
          href="/admin/dashboard/users"
          active={pathname === "/admin/dashboard/users"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<UserCheck className="h-5 w-5" />}
          label="Kyc"
          href="/admin/dashboard/kyc"
          active={pathname === "/admin/dashboard/kyc"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Truck className="h-5 w-5" />}
          label="Orders"
          href="/admin/dashboard/all-orders"
          active={pathname === "/admin/dashboard/all-orders"}
          collapsed={sidebarCollapsed}
        />

        <NavItem
          icon={<Info className="h-5 w-5" />}
          label="Reports"
          href="/admin/dashboard/reports"
          active={pathname === "/admin/dashboard/reports"}
          collapsed={sidebarCollapsed}
        />

        <NavItem
          icon={<Calculator className="h-5 w-5" />}
          label="Rate Calculator"
          href="/admin/dashboard/rate-calculator"
          active={pathname === "/admin/dashboard/rate-calculator"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Ticket className="h-5 w-5" />}
          label="Coupon"
          href="/admin/dashboard/coupon"
          active={pathname === "/admin/dashboard/coupon"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Truck className="h-5 w-5" />}
          label="Shipping Rates"
          href="/admin/dashboard/shipping-rates"
          active={pathname === "/admin/dashboard/shipping-rates"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Newspaper className="h-5 w-5" />}
          label="News"
          href="/admin/dashboard/news"
          active={pathname === "/admin/dashboard/news"}
          collapsed={sidebarCollapsed}
        />
        <div
          className={cn(
            "flex items-center px-4 py-1 mt-2 cursor-pointer rounded-l-full transition-colors hover:bg-indigo-900",
            sidebarCollapsed ? "justify-center" : "",
          )}
        >
          <div className={cn("flex font-bold items-center w-full", sidebarCollapsed ? "justify-center" : "")}>
            <LogOut className="h-5 w-5 flex-shrink-0 cursor-pointer" />
            <div
              className={cn(
                "ml-3 whitespace-nowrap transition-all duration-300 w-full",
                sidebarCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
              )}
            >
              <LogoutButton
                propUser="admin"
                propStyle={{ color: "text-[#f3f4f6]" }}
              />
            </div>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-indigo-900">
        <Button
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer justify-center text-[#f3f4f6] hover:bg-indigo-900"
          onClick={toggleSidebar}
        >
          <ChevronRight className={cn("h-5 w-5 transition-transform", sidebarCollapsed ? "rotate-180" : "")} />
          {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}