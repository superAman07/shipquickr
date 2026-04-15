"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Banknote,
  Calculator,
  ChevronRight,
  IndianRupee,
  Info,
  ListFilter,
  LocateIcon,
  LogOut,
  MessageSquareWarning,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Truck,
  X,
  House,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import LogoutButton from "./logout";

function NavItem({
  icon,
  label,
  href,
  active = false,
  collapsed,
  onMobileClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed: boolean;
  onMobileClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onMobileClick}
      className={cn(
        "mt-2 flex cursor-pointer items-center rounded-l-full px-4 py-3 transition-colors",
        active ? "bg-[#f9fafb]" : "hover:bg-indigo-900",
        collapsed ? "justify-center" : ""
      )}
    >
      <div
        className={cn(
          "flex w-full items-center font-bold",
          collapsed ? "justify-center" : ""
        )}
      >
        <div
          className={cn(
            "flex-shrink-0",
            active ? "text-[#252525]" : "text-[#f9fafb]"
          )}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(
                icon as React.ReactElement<{ className?: string }>,
                {
                  className: cn(
                    (icon.props as { className?: string }).className,
                    "h-5 w-5",
                    active ? "text-[#252525]" : "text-[#f9fafb]"
                  ),
                }
              )
            : icon}
        </div>

        <span
          className={cn(
            "ml-3 w-full whitespace-nowrap transition-all duration-300",
            collapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-xs opacity-100",
            active ? "text-[#252525]" : "text-[#f9fafb]"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

function OrdersNavItem({
  collapsed,
  onMobileClick,
}: {
  collapsed: boolean;
  onMobileClick?: () => void;
}) {
  const pathname = usePathname();
  const [showSubMenu, setShowSubMenu] = useState(false);

  const active =
    (pathname.includes("/user/dashboard/bulk") ||
      (pathname.startsWith("/user/dashboard/unshipped") &&
        !pathname.startsWith("/user/dashboard/unshipped-reports")) ||
      pathname.includes("/user/dashboard/shipped") ||
      pathname.includes("/user/dashboard/cancel")) &&
    true;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
    >
      <Link
        href="/user/dashboard/bulk"
        onClick={onMobileClick}
        className={cn(
          "mt-2 flex cursor-pointer items-center rounded-l-full px-4 py-3 transition-colors",
          active ? "bg-[#f9fafb] text-[#252525]" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : ""
        )}
      >
        <div
          className={cn(
            "flex w-full items-center font-bold",
            collapsed ? "justify-center" : ""
          )}
        >
          <Truck className="h-5 w-5 shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 w-full whitespace-nowrap transition-all duration-300",
              collapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-xs opacity-100"
            )}
          >
            Orders
          </span>
        </div>
      </Link>

      <div
        className={cn(
          "submenu absolute left-full top-0 z-50 overflow-hidden rounded-r-lg bg-indigo-900 shadow-lg transition-all duration-200",
          showSubMenu ? "visible translate-x-0 opacity-100" : "invisible -translate-x-2 opacity-0",
          collapsed ? "mt-3" : "ml-0 mt-3"
        )}
      >
        <Link
          href="/user/dashboard/single-order"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-800"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Add Single Order</span>
        </Link>

        <Link
          href="/user/dashboard/bulk"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-800"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Process Bulk Orders</span>
        </Link>
      </div>
    </div>
  );
}

function ComplaintsNavItem({
  collapsed,
  onMobileClick,
}: {
  collapsed: boolean;
  onMobileClick?: () => void;
}) {
  const pathname = usePathname();
  const [showSubMenu, setShowSubMenu] = useState(false);

  const active = pathname.includes("/user/dashboard/complaints");

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
    >
      <div
        className={cn(
          "mt-3 flex cursor-pointer items-center rounded-l-full px-4 py-3 transition-colors",
          active ? "bg-indigo-900" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : ""
        )}
      >
        <div
          className={cn(
            "flex w-full items-center font-bold",
            collapsed ? "justify-center" : ""
          )}
        >
          <MessageSquareWarning className="h-5 w-5 flex-shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 w-full whitespace-nowrap transition-all duration-300",
              collapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-xs opacity-100"
            )}
          >
            Complaints
          </span>
        </div>
      </div>

      <div
        className={cn(
          "submenu absolute left-full top-0 z-50 overflow-hidden rounded-r-lg bg-indigo-800 shadow-lg transition-all duration-200",
          showSubMenu ? "visible translate-x-0 opacity-100" : "invisible -translate-x-2 opacity-0",
          collapsed ? "mt-3" : "ml-0 mt-3"
        )}
      >
        <Link
          href="/user/dashboard/complaints"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Complaints</span>
        </Link>

        <Link
          href="/user/dashboard/raised_complaints"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <ListFilter className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Raised Complaints</span>
        </Link>
      </div>
    </div>
  );
}

function SettingNavItem({
  collapsed,
  onMobileClick,
}: {
  collapsed: boolean;
  onMobileClick?: () => void;
}) {
  const pathname = usePathname();
  const [showSubMenu, setShowSubMenu] = useState(false);

  const active = pathname.includes("/user/dashboard/settings");

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
    >
      <div
        className={cn(
          "mt-3 flex cursor-pointer items-center rounded-l-full px-4 py-3 transition-colors",
          active ? "bg-indigo-900" : "hover:bg-indigo-900",
          collapsed ? "justify-center" : ""
        )}
      >
        <div
          className={cn(
            "flex w-full items-center font-bold",
            collapsed ? "justify-center" : ""
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0 cursor-pointer" />

          <span
            className={cn(
              "ml-3 w-full whitespace-nowrap transition-all duration-300",
              collapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-xs opacity-100"
            )}
          >
            Settings
          </span>
        </div>
      </div>

      <div
        className={cn(
          "submenu absolute left-full top-0 z-50 overflow-hidden rounded-r-lg bg-indigo-800 shadow-lg transition-all duration-200",
          showSubMenu ? "visible translate-x-0 opacity-100" : "invisible -translate-x-2 opacity-0",
          collapsed ? "mt-3" : "ml-0 mt-3"
        )}
      >
        <Link
          href="/user/dashboard/warehouse"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <House className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Warehouse List</span>
        </Link>

        <Link
          href="/user/dashboard/cod"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <IndianRupee className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">COD</span>
        </Link>

        <Link
          href="/user/dashboard/courier_serviceability"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <LocateIcon className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Pincode Serviceability</span>
        </Link>

        <Link
          href="/user/dashboard/settings/courier-priority"
          onClick={onMobileClick}
          className="flex w-full items-center px-4 py-3 transition-colors hover:bg-indigo-700"
        >
          <Truck className="h-4 w-4" />
          <span className="ml-3 whitespace-nowrap">Courier Priority</span>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardSidebarUser({
  mobileMenuOpen,
  setMobileMenuOpen,
}: any) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(false);
      } else {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileMenuOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex h-full flex-col bg-[#0a0c37] text-[#f9fafb] transition-all duration-300 ease-in-out",

          "fixed left-0 top-0 z-50 w-50 transform",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",

          "md:static md:z-auto md:translate-x-0",
          sidebarCollapsed ? "md:w-16" : "md:w-50"
        )}
      >
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className={cn(
              "absolute right-[-18px] top-1/2 z-40 hidden -translate-y-1/2 cursor-pointer rounded-full border border-indigo-900 bg-indigo-700 p-1 text-[#f9fafb] shadow-lg backdrop-blur transition-transform hover:bg-indigo-800 md:flex",
              "bg-indigo-700/60",
              sidebarCollapsed ? "rotate-180" : ""
            )}
            style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        <nav className="flex-1 pt-20 md:pt-4">
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
            active={
              pathname === "/user/dashboard/reports" ||
              pathname === "/user/dashboard/in-transit" ||
              pathname === "/user/dashboard/out-for-delivery" ||
              pathname === "/user/dashboard/unshipped-reports" ||
              pathname === "/user/dashboard/delivered" ||
              pathname === "/user/dashboard/undelivered" ||
              pathname === "/user/dashboard/rto-intransit" ||
              pathname === "/user/dashboard/rto-delivered" ||
              pathname === "/user/dashboard/lost-shipment"
            }
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
              "mt-2 flex cursor-pointer items-center rounded-l-full px-4 py-1 transition-colors hover:bg-indigo-900",
              !isMobile && sidebarCollapsed ? "justify-center" : ""
            )}
          >
            <div
              className={cn(
                "flex w-full items-center font-bold",
                !isMobile && sidebarCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 cursor-pointer" />
              <div
                className={cn(
                  "ml-3 w-full whitespace-nowrap transition-all duration-300",
                  !isMobile && sidebarCollapsed
                    ? "max-w-0 overflow-hidden opacity-0"
                    : "max-w-xs opacity-100"
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
          <div className="border-t border-indigo-900 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full cursor-pointer justify-center text-[#f9fafb] hover:bg-indigo-900"
              onClick={toggleSidebar}
            >
              <ChevronRight
                className={cn(
                  "h-5 w-5 transition-transform",
                  sidebarCollapsed ? "rotate-180" : ""
                )}
              />
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}