"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Wallet, ChevronDown, User, Lock, LogOut, BadgePlusIcon as BatteryPlus, MoreVertical } from "lucide-react"
import LogoutButton from "./logout"
import Link from "next/link"
import { useWallet as useActualWallet, type WalletContextType } from "@/contexts/WalletContext"
import RechargeModal from "./recharge-model"

const useConditionalWallet = (userRole: string): WalletContextType => {
  const walletContext = useActualWallet()
  if (userRole !== "admin") {
    return walletContext
  }
  return {
    balance: null,
    isLoadingBalance: false,
    refreshBalance: async () => { },
  }
}
interface NavbarProps {
  userRole: string
  userName: string
  mobileMenuOpen: boolean
  setMobileMenuOpenAction: (open: boolean) => void
}

export default function Navbar({ userRole, userName, mobileMenuOpen, setMobileMenuOpenAction }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { balance, isLoadingBalance } = useConditionalWallet(userRole)

  const getInitials = (name: string) => {
    if (!name) return ""
    const names = name.split(" ")
    const firstName = names[0] || ""
    const lastName = names.length > 1 ? names[names.length - 1] : ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleRechargeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsRechargeModalOpen(true)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              className="md:hidden mr-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpenAction(!mobileMenuOpen)}
              aria-label="Open sidebar"
            >
              <svg className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <Link href={`/${userRole}/dashboard`} className="flex items-center">
                <img src="/shipquickr.png" alt="Logo" className="h-[57px] w-[145px]" />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-0">
              {userRole !== "admin" && (
                <div className="flex justify-between space-x-2">
                  <div className="block">
                    <button
                      onClick={handleRechargeClick}
                      className="flex items-center cursor-pointer space-x-1 px-4 py-2 rounded-md bg-[#0a0c37] text-white font-semibold text-sm hover:bg-[#0a0c37e1] transition"
                    >
                      <BatteryPlus />
                      <span className="pl-1">Recharge</span>
                    </button>
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                    <Link href="/user/dashboard/wallet" className="flex items-center gap-2 px-4">
                      <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {isLoadingBalance ? "Loading..." : `₹${balance !== null ? balance.toFixed(2) : "0.00"}`}
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              <div className="relative cursor-pointer">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="h-8 w-8 rounded-full bg-[#0a0c37] dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-200 dark:text-gray-200">
                    {getInitials(userName)}
                  </div>
                  <span className="cursor-pointer text-gray-700 dark:text-gray-300">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                {isProfileOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700"
                  >
                    <Link
                      href={`/${userRole}/dashboard/profile`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Your Profile
                    </Link>
                    <Link
                      href={`/${userRole}/dashboard/change-password`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Change Password
                    </Link>
                    <hr />
                    <Link
                      href={""}
                      className="flex items-center gap-2 px-4 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                    >
                      <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <LogoutButton propUser={userRole} propStyle={{ color: "text-gray-500 dark:text-gray-200" }} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="md:hidden flex items-center gap-3">
              {userRole !== "admin" && (
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    ₹{balance !== null ? balance.toFixed(2) : "0.00"}
                  </span>
                </div>
              )}

              {/* Mobile Profile Avatar - Make it clickable */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="h-8 w-8 rounded-full bg-[#0a0c37] dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-200 dark:text-gray-200 hover:bg-[#0a0c37e1] transition-colors"
                >
                  {getInitials(userName)}
                </button>

                {/* Profile Dropdown - Original one */}
                {isProfileOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700"
                  >
                    <Link
                      href={`/${userRole}/dashboard/profile`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Your Profile
                    </Link>
                    <Link
                      href={`/${userRole}/dashboard/change-password`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Change Password
                    </Link>
                    <hr />
                    <div className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <LogoutButton propUser={userRole} propStyle={{ color: "text-gray-500 dark:text-gray-200" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile 3-dot Menu - Only for new features */}
              <div className="relative" ref={mobileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>

                {/* 3-dot Dropdown - Only new features */}
                <div
                  className={`absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-out transform origin-top-right ${isMobileMenuOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                >
                  <div className="py-2">
                    {userRole !== "admin" && (
                      <button
                        onClick={handleRechargeClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white bg-[#0a0c37] hover:bg-[#0a0c37e1] transition-colors"
                      >
                        <BatteryPlus className="h-5 w-5" />
                        <span className="font-semibold">Recharge</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <RechargeModal
        isOpen={isRechargeModalOpen}
        onCloseAction={() => setIsRechargeModalOpen(false)}
        currentBalance={balance || 0}
      />
    </>
  )
}