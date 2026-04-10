"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import Navbar from "./NavBar";
import DashboardSidebarUser from "./dashboard-sidebar-user";
import DashboardSidebarAdmin from "./dashboard-sidebar-admin";

interface DashboardLayoutWrapperProps {
  userRole: string;
  userName: string;
  userId: string;
  children: ReactNode;
}

export default function DashboardLayoutWrapper({
  userRole,
  userName,
  userId,
  children,
}: DashboardLayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Navbar
        userRole={userRole}
        userName={userName}
        userId={userId}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpenAction={setMobileMenuOpen}
      />

      {/* REMOVED overflow-x-hidden here to restore sticky behaviour */}
      <div className="flex bg-gray-50 dark:bg-[#10162A] pt-16">
        <div className="pointer-events-none absolute left-0 top-0 z-0 h-[180px] w-full bg-linear-to-r from-[#0a0c37] to-[#0a0c37] sm:hidden" />

        {pathname === "/user/dashboard" && (
          <div className="pointer-events-none absolute left-0 top-0 z-0 hidden h-[200px] w-full bg-[#0a0c37] sm:block" />
        )}

        <div className="relative flex min-w-0 w-full flex-1">
          <aside className="sticky top-16 z-30 h-[calc(100vh-4rem)]">
            {userRole === "admin" ? (
              <DashboardSidebarAdmin />
            ) : (
              <DashboardSidebarUser
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            )}
          </aside>

          <div className="flex min-w-0 w-full flex-1 flex-col">
            <main className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}