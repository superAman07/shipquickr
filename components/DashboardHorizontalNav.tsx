"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, Info, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/user/dashboard", icon: <Package className="h-6 w-6" />, label: "Dashboard" },
  { href: "/user/dashboard/orders", icon: <Truck className="h-6 w-6" />, label: "Orders" },
  { href: "/user/dashboard/reports", icon: <Info className="h-6 w-6" />, label: "Reports" },
  { href: "/user/dashboard/rate-calculator", icon: <Calculator className="h-6 w-6" />, label: "Rate Calculator" },
];

export default function DashboardHorizontalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full justify-between gap-2 bg-indigo-950 px-2 py-2 rounded-t-xl shadow mb-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 rounded-lg font-medium text-white transition-colors",
            pathname === item.href
              ? "bg-indigo-700 shadow"
              : "hover:bg-indigo-900"
          )}
        >
          <span>{item.icon}</span>
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}