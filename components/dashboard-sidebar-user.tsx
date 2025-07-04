"use client"
import Link from "next/link"
import React from "react"

import { usePathname } from "next/navigation"
import { Package, Truck, Info, Calculator, ChevronRight, Plus, ListFilter, RefreshCw, Banknote, IndianRupee, MessageSquareWarning, Settings, House, LocateIcon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import LogoutButton from "./logout"

function NavItem({
  icon,
  label,
  href,
  active = false,
  collapsed,
}: {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-4 py-3 mt-2 cursor-pointer rounded-l-full transition-colors",
        active ? "bg-[#f9fafb]" : "hover:bg-indigo-900",
        collapsed ? "justify-center" : "",
      )}
    >
      <div className={cn("flex font-bold items-center w-full", collapsed ? "justify-center" : "")}>
        <div className={cn("flex-shrink-0", active ? "text-[#252525]" : "text-[#f9fafb]")}>
          {React.isValidElement(icon)
            ? React.cloneElement( 
                icon as React.ReactElement<{ className?: string }>,
                {
                  className: cn(
                    (icon.props as { className?: string }).className,
                    "h-5 w-5",
                    active ? "text-[#252525]" : "text-[#f9fafb]"
                  )
                }
              )
            : icon}
        </div>
        <span
          className={cn(
            "ml-3 whitespace-nowrap transition-all duration-300 w-full",
            collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
            active ? "text-[#252525]" : "text-[#f9fafb]"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  )
}

function OrdersNavItem({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [showSubMenu, setShowSubMenu] = useState(false)
  const active = pathname.includes("/user/dashboard/orders")

  return (
    <div className="relative" onMouseEnter={() => setShowSubMenu(true)} onMouseLeave={() => setShowSubMenu(false)}>
      <div
        className={cn(
          "flex items-center px-4 py-3 mt-2 cursor-pointer rounded-l-full transition-colors",
          active ? "bg-[#f9fafb] text-[#252525]" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : "",
        )}
      >
        <div className={cn("flex font-bold items-center w-full", collapsed ? "justify-center" : "")}>
          <Truck className="h-5 w-5 flex-shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 whitespace-nowrap transition-all duration-300 w-full",
              collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
            )}
          >
            Orders
          </span>
        </div>
      </div>
 
      <div
        className={cn(
          "absolute left-full top-0 bg-indigo-800 rounded-r-lg shadow-lg overflow-hidden transition-all duration-200 z-50",
          showSubMenu ? "opacity-100 translate-x-0 visible" : "opacity-0 -translate-x-2 invisible",
          collapsed ? "mt-3" : "mt-3 ml-0",
          "submenu"
        )}
      >
        <Link
          href="/user/dashboard/single-order"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Add Single Order</span>
        </Link>
        <Link
          href="/user/dashboard/bulk"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Process Bulk Orders</span>
        </Link>
      </div>
    </div>
  )
}
function ComplaintsNavItem({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [showSubMenu, setShowSubMenu] = useState(false)
  const active = pathname.includes("/user/dashboard/complaints")

  return (
    <div className="relative" onMouseEnter={() => setShowSubMenu(true)} onMouseLeave={() => setShowSubMenu(false)}>
      <div
        className={cn(
          "flex items-center px-4 py-3 mt-3 cursor-pointer rounded-l-full transition-colors",
          active ? "bg-indigo-900" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : "",
        )}
      >
        <div className={cn("flex font-bold items-center w-full", collapsed ? "justify-center" : "")}>
          <MessageSquareWarning className="h-5 w-5 flex-shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 whitespace-nowrap transition-all duration-300 w-full",
              collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
            )}
          >
            Complaints
          </span>
        </div>
      </div>
 
      <div
        className={cn(
          "absolute left-full top-0 bg-indigo-800 rounded-r-lg shadow-lg overflow-hidden transition-all duration-200 z-50",
          showSubMenu ? "opacity-100 translate-x-0 visible" : "opacity-0 -translate-x-2 invisible",
          collapsed ? "mt-3" : "mt-3 ml-0",
          "submenu"
        )}
      >
        <Link
          href="/user/dashboard/complaints"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Complaints</span>
        </Link>
        <Link
          href="/user/dashboard/raised_complaints"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Raised Complaints</span>
        </Link>
      </div>
    </div> 
  )
}
function SettingNavItem({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [showSubMenu, setShowSubMenu] = useState(false)
  const active = pathname.includes("/user/dashboard/settings")

  return (
    <div className="relative" onMouseEnter={() => setShowSubMenu(true)} onMouseLeave={() => setShowSubMenu(false)}>
      <div
        className={cn(
          "flex items-center px-4 py-3 mt-3 cursor-pointer rounded-l-full transition-colors",
          active ? "bg-indigo-900" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : "",
        )}
      >
        <div className={cn("flex font-bold items-center w-full", collapsed ? "justify-center" : "")}>
          <Settings className="h-5 w-5 flex-shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 whitespace-nowrap transition-all duration-300 w-full",
              collapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
            )}
          >
            Settings
          </span>
        </div>
      </div>
 
      <div
        className={cn(
          "absolute left-full top-0 bg-indigo-800 rounded-r-lg shadow-lg overflow-hidden transition-all duration-200 z-50",
          showSubMenu ? "opacity-100 translate-x-0 visible" : "opacity-0 -translate-x-2 invisible",
          collapsed ? "mt-3" : "mt-3 ml-0",
          "submenu"
        )}
      >
        <Link
          href="/user/dashboard/warehouse"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <House className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Warehouse List</span>
        </Link>
        <Link
          href="/user/dashboard/cod"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <IndianRupee className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">COD</span>
        </Link>
        <Link
          href="/user/dashboard/courier_serviceability"
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <LocateIcon className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Pincode Serviceability</span>
        </Link>
      </div>
    </div> 
  )
}

export default function DashboardSidebarUser() {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setSidebarCollapsed(isMobile)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  return (
    <aside
      className={cn(
        `bg-[#0a0c37] text-[#f9fafb] h-full transition-all duration-300 ease-in-out flex flex-col`,
        sidebarCollapsed ? "w-16" : "w-50",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        className={cn(
          "absolute z-40 cursor-pointer right-[-18px] top-1/2 -translate-y-1/2 bg-indigo-700 text-[#f9fafb] border border-indigo-900 shadow-lg rounded-full p-1 transition-transform",
          "hover:bg-indigo-800",
          "backdrop-blur bg-indigo-700/60",
          sidebarCollapsed ? "rotate-180" : "",
        )}
        style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <nav className="flex-1 pt-4">
        <NavItem
          icon={<Package className="h-5 w-5" />}
          label="Dashboard"
          href="/user/dashboard"
          active={pathname === "/user/dashboard"}
          collapsed={sidebarCollapsed}
        />
 
        <OrdersNavItem collapsed={sidebarCollapsed} />

        <NavItem
          icon={<Info className="h-5 w-5" />}
          label="Reports"
          href="/user/dashboard/reports"
          active={pathname === "/user/dashboard/reports"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<RefreshCw className="h-5 w-5" />}
          label="NDR"
          href="/user/dashboard/ndr"
          active={pathname === "/user/dashboard/ndr"}
          collapsed={sidebarCollapsed}
        />

        <NavItem
          icon={<Calculator className="h-5 w-5" />}
          label="Rate Calculator"
          href="/user/dashboard/rate-calculator"
          active={pathname === "/user/dashboard/rate-calculator"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<Banknote className="h-5 w-5" />}
          label="Remittance"
          href="/user/dashboard/remittance"
          active={pathname === "/user/dashboard/remittance"}
          collapsed={sidebarCollapsed}
        />
        <NavItem
          icon={<IndianRupee className="h-5 w-5 flex-shrink-0 cursor-pointer" />}
          label="Billings"
          href="/user/dashboard/recharge"
          active={pathname === "/user/dashboard/recharge"}
          collapsed={sidebarCollapsed}
        />
        <ComplaintsNavItem collapsed={sidebarCollapsed}/>
        <SettingNavItem collapsed={sidebarCollapsed}/>
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
                propUser="user"
                propStyle={{ color: "text-[#f9fafb]"}} 
              />
            </div>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-indigo-900">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center cursor-pointer text-[#f9fafb] hover:bg-indigo-900"
          onClick={toggleSidebar}
        >
          <ChevronRight className={cn("h-5 w-5 transition-transform", sidebarCollapsed ? "rotate-180" : "")} />
          {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}