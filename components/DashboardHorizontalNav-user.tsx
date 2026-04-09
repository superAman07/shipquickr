"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  PackagePlus, 
  Calculator, 
  PlusIcon as HousePlus, 
  Wallet, 
  Banknote,
  ShieldAlert,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { KYCNavIcon } from "./ui/kycNavIcon"
import axios from "axios"
import useSWR from "swr"
import { Button } from "./ui/button"

export default function DashboardHorizontalNavUser() {
  const pathname = usePathname()
  const router = useRouter()
  const [showKycModal, setShowKycModal] = useState(false)

  const fetcher = (url: string) => axios.get(url).then((res) => res.data)
  const { data, isLoading } = useSWR("/api/user/kyc", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const kycStatus = isLoading ? "loading" : data?.kycStatus || "not_found"
  const isKycApproved = kycStatus === "approved"

  // Auto-Popup Effect - Once per session logic added!
  useEffect(() => {
    if (!isLoading && !isKycApproved && kycStatus !== "loading") {
      // Check if they've already seen it this session
      const hasSeenModal = sessionStorage.getItem("kyc_modal_seen")
      
      if (!hasSeenModal) {
        const timer = setTimeout(() => {
          setShowKycModal(true)
          sessionStorage.setItem("kyc_modal_seen", "true") // Mark as seen!
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, [isLoading, isKycApproved, kycStatus])

  // Intercept clicks on Restricted actions
  const handleRestrictedClick = (e: React.MouseEvent, href: string, isRestricted: boolean) => {
    if (isRestricted && !isKycApproved) {
      e.preventDefault()
      setShowKycModal(true)
    }
  }

  const navItems = [
    {
      href: "/user/dashboard/single-order",
      icon: PackagePlus,
      label: "Add Order",
      shortLabel: "Add Order",
      showOnMobile: true,
      colorClass: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30",
      restricted: true 
    },
    {
      href: "/user/dashboard/rate-calculator",
      icon: Calculator,
      label: "Rate Calculator",
      shortLabel: "Calculator",
      showOnMobile: true,
      colorClass: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30",
      restricted: false 
    },
    {
      href: "/user/dashboard/warehouse",
      icon: HousePlus,
      label: "Add Warehouse",
      shortLabel: "Warehouse",
      showOnMobile: true,
      colorClass: "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30",
      restricted: true 
    },
    {
      href: "/user/dashboard/wallet",
      icon: Wallet,
      label: "Recharge Wallet",
      shortLabel: "Wallet",
      showOnMobile: true,
      colorClass: "bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-500/30",
      restricted: false
    },
    {
      href: isKycApproved ? "/user/dashboard/profile" : "/user/dashboard/kyc",
      icon: null,
      customIcon: <KYCNavIcon status={kycStatus} />,
      label: isKycApproved ? "KYC Verified" : "KYC Verification",
      shortLabel: isKycApproved ? "Verified" : "KYC",
      showOnMobile: true,
      colorClass: isKycApproved 
        ? "bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/30"
        : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30",
      restricted: false
    },
    {
      href: "/user/dashboard/cod",
      icon: Banknote,
      label: "Cash on Delivery",
      shortLabel: "COD",
      showOnMobile: false,
      colorClass: "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-cyan-500/30",
      restricted: false
    },
  ]

  const visibleItems = navItems.filter((item) => item.showOnMobile)

  return (
    <>
      <div className="w-full mb-6 relative z-10"> 
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex w-full justify-between gap-3 rounded-t-3xl rounded-b-none bg-gradient-to-b from-white to-gray-50 dark:to-[#10162A] pt-3 px-2 pb-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleRestrictedClick(e, item.href, item.restricted)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-4 px-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-br from-slate-50 to-indigo-50/50 shadow-sm border border-slate-200/60"
                    : "hover:bg-slate-50 hover:text-slate-900 border border-transparent",
                )}
              >
                <div className={cn(
                  "flex items-center justify-center relative mb-2 p-3 rounded-2xl transition-all duration-300 shadow-lg text-white",
                  item.colorClass,
                  isActive ? "scale-110 shadow-xl" : "opacity-90 group-hover:scale-105 group-hover:opacity-100"
                )}>
                  {IconComponent ? (
                    <IconComponent className="h-6 w-6" strokeWidth={2.25} />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center text-white mix-blend-plus-lighter [&_path]:stroke-white [&_circle]:stroke-white">
                      {item.customIcon}
                    </div>
                  )}
                  {isActive && <div className="absolute -inset-1 bg-white rounded-2xl -z-10 animate-pulse opacity-20" />}
                </div>
                <span className={cn("text-[13px] font-semibold text-center leading-tight tracking-tight", isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Navigation */}
        <nav className="flex lg:hidden w-full justify-between gap-1 rounded-t-2xl rounded-b-none bg-gradient-to-b from-white to-slate-50 dark:to-[#10162A] p-2 pb-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleRestrictedClick(e, item.href, item.restricted)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-start pt-3 pb-2 px-1 rounded-xl font-medium transition-all duration-200 group relative min-w-0 h-[80px]",
                  isActive ? "bg-slate-50 shadow-sm border border-slate-200/60" : "hover:bg-slate-50 border border-transparent",
                )}
              >
                <div className={cn("flex items-center justify-center relative mb-1.5 p-2.5 rounded-[14px] transition-all duration-300 shadow-md text-white", item.colorClass, isActive ? "scale-105 shadow-lg" : "opacity-90 group-hover:scale-105 group-hover:opacity-100")}>
                  {IconComponent ? <IconComponent className="h-5 w-5" strokeWidth={2.25} /> : <div className="flex h-5 w-5 items-center justify-center text-white mix-blend-plus-lighter [&_path]:stroke-white [&_circle]:stroke-white">{item.customIcon}</div>}
                </div>
                <span className={cn("text-[10px] font-semibold text-center leading-tight truncate w-[95%]", isActive ? "text-slate-900" : "text-slate-500")}>
                  {item.shortLabel}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Action-Blocking KYC Modal Popup (UI Fixed) */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {
             // Let them close it by clicking outside the modal
             if(e.target === e.currentTarget) setShowKycModal(false)
        }}>
          <div className="bg-white rounded-[24px] shadow-2xl max-w-sm w-full p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowKycModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-5">
                <ShieldAlert className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Complete KYC</h3>
              <p className="text-[15px] leading-relaxed text-slate-500 mb-8">
                Complete your KYC to start shipping orders seamlessly over the platform.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold flex-1 h-11 rounded-xl" 
                  onClick={() => {
                    setShowKycModal(false)
                    router.push("/user/dashboard/kyc")
                  }}
                >
                  Complete KYC Now
                </Button>
                <Button 
                  variant="secondary" 
                  className="bg-slate-500 hover:bg-slate-600 text-white cursor-pointer font-semibold flex-1 sm:flex-none sm:px-6 h-11 rounded-xl" 
                  onClick={() => setShowKycModal(false)}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}