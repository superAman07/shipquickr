"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Calculator, HousePlus, Wallet, UserCheck, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { KYCNavIcon } from "./ui/kycNavIcon"; 
import axios from "axios";
import useSWR from 'swr';


function CODIcon({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-1">
        <Package className="h-6 w-6" />
        <ArrowLeftRight className="h-5 w-5 text-white" />
        <Wallet className="h-6 w-6" />
      </div>
      <span className="text-sm mt-1 text-white font-medium">{label}</span>
    </div>
  );
}

export default function DashboardHorizontalNavUser() {
  const pathname = usePathname();
  const fetcher = (url: string) => axios.get(url).then(res => res.data);

  const { data, error, isLoading } = useSWR('/api/user/kyc', fetcher, {
    refreshInterval: 5000,
  });

  const kycStatus = isLoading ? "loading" : data?.kycStatus || "not_found";

  const navItems = [ 
    { href: "/user/dashboard/rate-calculator", icon: <Calculator className="h-8 w-8" />, label: "Rate Calculator" },
    { href: "/user/dashboard/wharehouse", icon: <HousePlus  className="h-8 w-8" />, label: "Add Warehouse" },
    { href: "/user/dashboard/wallet", icon: <Wallet className="h-8 w-8" />, label: "Recharge Wallet" },
    { href: "/user/dashboard/kyc", icon: <KYCNavIcon status={kycStatus}/>, label: "KYC" },
    { href: "/user/dashboard/reports", icon: <CODIcon label="COD" className="h-8 w-8" />},
    { href: "/user/dashboard/orders", icon: <Truck className="h-8 w-8" />, label: "Transporter ID" },
  ];

  return (
    <nav className="flex flex-wrap lg:flex-nowrap w-full overflow-hidden justify-between gap-1 sm:gap-2 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-4 shadow mb-2  ">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-4 rounded-lg font-medium text-white transition-colors hover:bg-indigo-800/40",
            pathname === item.href
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg ring-1 ring-indigo-500/50"
              : ""
          )}
        >
          <span className="flex items-center justify-center">{item.icon}</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}