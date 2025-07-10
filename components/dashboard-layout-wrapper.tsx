"use client"
import { useState } from "react"
import type React from "react"

import Navbar from "./NavBar"
import DashboardSidebarUser from "./dashboard-sidebar-user"

interface DashboardLayoutWrapperProps {
    userRole: string
    userName: string
    children: React.ReactNode
}

export default function DashboardLayoutWrapper({ userRole, userName, children }: DashboardLayoutWrapperProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <>
            <Navbar
                userRole={userRole}
                userName={userName}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpenAction={setMobileMenuOpen}
            />
            <div className="flex bg-gray-50 dark:bg-[#10162A] pt-16">
                <aside className="sticky top-16 h-[calc(100vh-4rem)] z-30">
                    <DashboardSidebarUser mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                </aside>
                <div className="flex-1 flex flex-col min-w-0 w-full">
                    <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-hidden">{children}</main>
                </div>
            </div>
        </>
    )
}
