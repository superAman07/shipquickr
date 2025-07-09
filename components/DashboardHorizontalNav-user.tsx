"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Truck, Calculator, PlusIcon as HousePlus, Wallet, ArrowLeftRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { KYCNavIcon } from "./ui/kycNavIcon"
import axios from "axios"
import useSWR from "swr"

function CODIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center relative", className)}>
      <div className="flex items-center gap-1.5">
        <Package className="h-5 w-5" />
        <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
        <Wallet className="h-5 w-5" />
      </div>
    </div>
  )
}

export default function DashboardHorizontalNavUser() {
  const pathname = usePathname()

  const fetcher = (url: string) => axios.get(url).then((res) => res.data)
  const { data, error, isLoading } = useSWR("/api/user/kyc", fetcher, {
    refreshInterval: 5000,
  })

  const kycStatus = isLoading ? "loading" : data?.kycStatus || "not_found"

  const navItems = [
    {
      href: "/user/dashboard/rate-calculator",
      icon: Calculator,
      label: "Rate Calculator",
      shortLabel: "Calculator",
      showOnMobile: true,
    },
    {
      href: "/user/dashboard/warehouse",
      icon: HousePlus,
      label: "Add Warehouse",
      shortLabel: "Warehouse",
      showOnMobile: true,
    },
    {
      href: "/user/dashboard/wallet",
      icon: Wallet,
      label: "Recharge Wallet",
      shortLabel: "Wallet",
      showOnMobile: true,
    },
    {
      href: "/user/dashboard/kyc",
      icon: null,
      customIcon: <KYCNavIcon status={kycStatus} />,
      label: "KYC Verification",
      shortLabel: "KYC",
      showOnMobile: true,
    },
    {
      href: "/user/dashboard/cod",
      icon: null,
      customIcon: <CODIcon />,
      label: "Cash on Delivery",
      shortLabel: "COD",
      showOnMobile: false, // Hide on mobile
    },
    {
      href: "/user/dashboard/bulk",
      icon: Truck,
      label: "Transporter ID",
      shortLabel: "Transporter ID",
      showOnMobile: true,
    },
  ]

  // Filter items based on screen size
  const visibleItems = navItems.filter((item) => item.showOnMobile)

  return (
    <div className="w-full mb-6">
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex w-full justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-4 px-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <div className="flex items-center justify-center mb-2 relative">
                {IconComponent ? (
                  <IconComponent
                    className={cn(
                      "h-6 w-6 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-blue-600" : "text-slate-500",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "transition-transform duration-200 group-hover:scale-110",
                      isActive ? "[&>*]:text-blue-600" : "[&>*]:text-slate-500",
                    )}
                  >
                    {item.customIcon}
                  </div>
                )}
                {isActive && (
                  <div className="absolute -inset-2 bg-blue-100 rounded-full -z-10 animate-pulse opacity-30" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium text-center leading-tight",
                  isActive ? "text-blue-700" : "text-slate-600",
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Navigation */}
      <nav className="flex lg:hidden w-full justify-between gap-1 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl font-medium transition-all duration-200 group relative min-w-0",
                isActive
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <div className="flex items-center justify-center mb-1.5 relative">
                {IconComponent ? (
                  <IconComponent
                    className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-blue-600" : "text-slate-500",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "transition-transform duration-200 group-hover:scale-110 [&>*]:h-5 [&>*]:w-5 sm:[&>*]:h-6 sm:[&>*]:w-6",
                      isActive ? "[&>*]:text-blue-600" : "[&>*]:text-slate-500",
                    )}
                  >
                    {item.customIcon}
                  </div>
                )}
                {isActive && (
                  <div className="absolute -inset-1.5 bg-blue-100 rounded-full -z-10 animate-pulse opacity-30" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center leading-tight truncate w-full",
                  isActive ? "text-blue-700" : "text-slate-600",
                )}
              >
                {item.shortLabel}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Loading State Overlay */}
      {/* {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )} */}
    </div>
  )
}




// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Package, Truck, Calculator, HousePlus, Wallet, UserCheck, ArrowLeftRight } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { KYCNavIcon } from "./ui/kycNavIcon"; 
// import axios from "axios";
// import useSWR from 'swr';


// function CODIcon({ className, label }: { className?: string; label?: string }) {
//   return (
//     <div className={`flex flex-col items-center ${className}`}>
//       <div className="flex items-center gap-1">
//         <Package className="h-5 w-5 md:h-6 md:w-6" />
//         <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5 text-gray-100" />
//         <Wallet className="h-5 w-5 md:h-6 md:w-6" />
//       </div>
//       <span className="text-sm mt-1 text-gray-100 font-medium">{label}</span>
//     </div>
//   );
// }

// export default function DashboardHorizontalNavUser() {
//   const pathname = usePathname();
//   const fetcher = (url: string) => axios.get(url).then(res => res.data);

//   const { data, error, isLoading } = useSWR('/api/user/kyc', fetcher, {
//     refreshInterval: 5000,
//   });

//   const kycStatus = isLoading ? "loading" : data?.kycStatus || "not_found";

//   const navItems = [ 
//     { href: "/user/dashboard/rate-calculator", icon: <Calculator className="h-6 w-6 md:h-8 md:w-8" />, label: "Rate Calculator" },
//     { href: "/user/dashboard/warehouse", icon: <HousePlus  className="h-6 w-6 md:h-8 md:w-8" />, label: "Add Warehouse" },
//     { href: "/user/dashboard/wallet", icon: <Wallet className="h-6 w-6 md:h-8 md:w-8" />, label: "Recharge Wallet" },
//     { href: "/user/dashboard/kyc", icon: <KYCNavIcon status={kycStatus}/>, label: "KYC" },
//     { href: "/user/dashboard/cod", icon: <CODIcon label="COD" className="h-6 w-6 md:h-8 md:w-8" />},
//     { href: "/user/dashboard/orders", icon: <Truck className="h-6 w-6 md:h-8 md:w-8" />, label: "Transporter ID" },
//   ];

//   return (
//     <nav className="flex flex-wrap lg:flex-nowrap w-full overflow-hidden justify-between gap-6 sm:gap-2 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-4 shadow mb-2  ">
//       {navItems.map((item) => (
//         <Link
//           key={item.href}
//           href={item.href}
//           className={cn(
//             "flex-1 flex flex-col items-center justify-center py-2.5 md:py-4 rounded-lg font-medium text-gray-100 transition-colors hover:bg-indigo-800/40",
//             pathname === item.href
//               ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg ring-1 ring-indigo-500/50"
//               : ""
//           )}
//         >
//           <span className="flex items-center justify-center">{item.icon}</span>
//           <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">{item.label}</span>
//         </Link>
//       ))}
//     </nav>
//   );
// }