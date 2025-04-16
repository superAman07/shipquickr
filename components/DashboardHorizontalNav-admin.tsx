"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Info, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", icon: <Package className="h-6 w-6" />, label: "Dashboard" },
  { href: "/admin/dashboard/orders", icon: <Truck className="h-6 w-6" />, label: "Orders" },
  { href: "/admin/dashboard/reports", icon: <Info className="h-6 w-6" />, label: "Reports" },
  { href: "/admin/dashboard/rate-calculator", icon: <Calculator className="h-6 w-6" />, label: "Rate Calculator" },
];

export default function DashboardHorizontalNavAdmin() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full justify-between gap-1 sm:gap-2 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow mb-2  ">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 rounded-lg font-medium text-white transition-colors hover:bg-indigo-800/40",
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