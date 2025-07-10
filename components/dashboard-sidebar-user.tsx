"use client"
import Link from "next/link"
import React from "react"

import { usePathname } from "next/navigation"
import { Package, Truck, Info, Calculator, ChevronRight, Plus, ListFilter, RefreshCw, Banknote, IndianRupee, MessageSquareWarning, Settings, House, LocateIcon, LogOut, Menu, X } from "lucide-react"
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
  onMobileClick,
}: {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
  collapsed: boolean
  onMobileClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onMobileClick}
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

function OrdersNavItem({ collapsed, onMobileClick }: { collapsed: boolean; onMobileClick?: () => void }) {
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
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Add Single Order</span>
        </Link>
        <Link
          href="/user/dashboard/bulk"
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Process Bulk Orders</span>
        </Link>
      </div>
    </div>
  )
}

function ComplaintsNavItem({ collapsed, onMobileClick }: { collapsed: boolean; onMobileClick?: () => void }) {
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
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Complaints</span>
        </Link>
        <Link
          href="/user/dashboard/raised_complaints"
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Raised Complaints</span>
        </Link>
      </div>
    </div>
  )
}

function SettingNavItem({ collapsed, onMobileClick }: { collapsed: boolean; onMobileClick?: () => void }) {
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
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <House className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Warehouse List</span>
        </Link>
        <Link
          href="/user/dashboard/cod"
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <IndianRupee className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">COD</span>
        </Link>
        <Link
          href="/user/dashboard/courier_serviceability"
          onClick={onMobileClick}
          className="flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors w-full"
        >
          <LocateIcon className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Pincode Serviceability</span>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardSidebarUser({ mobileMenuOpen, setMobileMenuOpen }: any) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(false)
      } else {
        setMobileMenuOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* sidebar */}
      <aside
        className={cn(
          `bg-[#0a0c37] text-[#f9fafb] h-full transition-all duration-300 ease-in-out flex flex-col`,
          !isMobile && (sidebarCollapsed ? "w-16" : "w-50"),
          isMobile && [
            "fixed top-0 left-0 z-40 w-50 h-full transform transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          ]
        )}
      >
        {!isMobile && (
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
        )}

        <nav className={cn("flex-1", isMobile ? "pt-20" : "pt-4")}>
          <NavItem
            icon={<Package className="h-5 w-5" />}
            label="Dashboard"
            href="/user/dashboard"
            active={pathname === "/user/dashboard"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />

          <OrdersNavItem
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />

          <NavItem
            icon={<Info className="h-5 w-5" />}
            label="Reports"
            href="/user/dashboard/reports"
            active={pathname === "/user/dashboard/reports"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <NavItem
            icon={<RefreshCw className="h-5 w-5" />}
            label="NDR"
            href="/user/dashboard/ndr"
            active={pathname === "/user/dashboard/ndr"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />

          <NavItem
            icon={<Calculator className="h-5 w-5" />}
            label="Rate Calculator"
            href="/user/dashboard/rate-calculator"
            active={pathname === "/user/dashboard/rate-calculator"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <NavItem
            icon={<Banknote className="h-5 w-5" />}
            label="Remittance"
            href="/user/dashboard/remittance"
            active={pathname === "/user/dashboard/remittance"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <NavItem
            icon={<IndianRupee className="h-5 w-5 flex-shrink-0 cursor-pointer" />}
            label="Billings"
            href="/user/dashboard/recharge"
            active={pathname === "/user/dashboard/recharge"}
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <ComplaintsNavItem
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <SettingNavItem
            collapsed={!isMobile && sidebarCollapsed}
            onMobileClick={handleMobileNavClick}
          />
          <div
            className={cn(
              "flex items-center px-4 py-1 mt-2 cursor-pointer rounded-l-full transition-colors hover:bg-indigo-900",
              (!isMobile && sidebarCollapsed) ? "justify-center" : "",
            )}
          >
            <div className={cn("flex font-bold items-center w-full", (!isMobile && sidebarCollapsed) ? "justify-center" : "")}>
              <LogOut className="h-5 w-5 flex-shrink-0 cursor-pointer" />
              <div
                className={cn(
                  "ml-3 whitespace-nowrap transition-all duration-300 w-full",
                  (!isMobile && sidebarCollapsed) ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-xs",
                )}
              >
                <LogoutButton
                  propUser="user"
                  propStyle={{ color: "text-[#f9fafb]" }}
                />
              </div>
            </div>
          </div>
        </nav>

        {!isMobile && (
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
        )}
      </aside>
    </>
  )
}