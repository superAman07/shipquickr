import React from "react";
import {
  AlertCircle,
  Calculator,
  Info,
  Package,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

import DashboardHorizontalNavUser from "@/components/DashboardHorizontalNav-user";
import DashboardWelcome from "@/components/DashboardWelcome";
import NewsSection from "@/components/NewsSectionUser";
import ShipmentChart from "@/components/ShipmentChart";
import { KycAlertBanner } from "@/components/ui/kyc-alert-banner";
import WhatsAppChat from "@/components/WhatsAppChat";
import { prisma } from "@/lib/prisma";

interface ShipmentCardProps {
  title: string;
  value: string;
  info: string;
  color: string;
  icon: React.ReactNode;
  link: string;
}

function ShipmentCard({
  title,
  value,
  info,
  color,
  icon,
  link,
}: ShipmentCardProps) {
  return (
    <div
      className={`${color} rounded-lg p-3 text-white transition-transform duration-200 hover:scale-105 md:p-6`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs opacity-90 sm:text-sm">{title}</p>
          <h3 className="mt-1 text-xl font-bold sm:mt-2 sm:text-3xl">
            {value}
          </h3>
        </div>

        <div className="rounded-lg bg-white/20 p-2">
          <Link href={link}>{icon}</Link>
        </div>
      </div>

      <p className="mt-2 text-xs opacity-90 sm:mt-4 sm:text-sm">{info}</p>
    </div>
  );
}

interface StatusCardProps {
  count: string;
  percentage: string;
  status: string;
  color: string;
  dbStatuses: string[];
}

const getProgressBarColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes("unshipped")) return "bg-slate-400 dark:bg-slate-500";
  if (lowerStatus.includes("pickup scheduled")) return "bg-rose-500";
  if (lowerStatus.includes("in-transit") && !lowerStatus.includes("rto"))
    return "bg-amber-500";
  if (lowerStatus.includes("delivered") && !lowerStatus.includes("rto"))
    return "bg-green-500";
  if (lowerStatus.includes("un-delivered")) return "bg-sky-500";
  if (lowerStatus.includes("ofd")) return "bg-red-600";
  if (lowerStatus.includes("rto in-transit")) return "bg-orange-500";
  if (lowerStatus.includes("rto delivered")) return "bg-lime-500";
  if (lowerStatus.includes("lost")) return "bg-neutral-500";

  return "bg-indigo-500";
};

function StatusCard({
  count,
  percentage,
  status,
  color,
  dbStatuses,
}: StatusCardProps) {
  const progressBarColor = getProgressBarColor(status);
  const displayCount = `${count}(${percentage})`;

  // Only create comma-separated list of exact statuses for the url filtering
  const statusQuery = dbStatuses.join(",");

  // Conditionally set the destination link based on the status
  const isUnshipped = status.toLowerCase().includes("unshipped");
  const destinationLink = isUnshipped
    ? `/user/dashboard/bulk?tab=unshipped`
    : `/user/dashboard/reports?status=${statusQuery}`;

  return (
    <Link href={destinationLink} className="block h-full">
      <div
        className={`${color} flex h-full cursor-pointer flex-col items-center rounded-lg p-5 text-center transition-transform hover:scale-105 hover:shadow-md`}
      >
        <div className="mb-1.5">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white">
            {displayCount}
          </h4>
        </div>

        <p className="mb-3 flex-grow text-sm font-medium capitalize text-gray-600 dark:text-gray-400">
          {status}
        </p>

        <div className="mt-auto h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
          <div
            className={`${progressBarColor} h-2 rounded-full`}
            style={{ width: percentage }}
          />
        </div>
      </div>
    </Link>
  );
}

interface TokenDetailsType {
  userId: string;
  firstName: string;
  email: string;
  role: string;
}

export default async function Dashboard() {
  const activeBanner = await prisma.globalBanner.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  const cookieStore = await cookies();
  const token = cookieStore.get("userToken")?.value;

  let firstName = "User";
  let userId = "";

  if (token) {
    try {
      const decoded = jwtDecode<TokenDetailsType>(token);
      firstName = decoded.firstName;
      userId = decoded.userId;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  let statusCounts: Record<string, number> = {};
  let totalShipments = 0;
  let todayShipments = 0;
  let yesterdayShipments = 0;
  let totalLoad = 0;
  let avgShipmentCost = 0;

  if (userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const orderStats = await prisma.order.findMany({
      where: {
        userId: Number(userId),
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        status: true,
        createdAt: true,
        physicalWeight: true,
        shippingCost: true,
      },
    });

    totalShipments = orderStats.length;
    let shippedOrdersCount = 0;

    orderStats.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      const orderDate = new Date(order.createdAt);
      if (orderDate >= today) {
        todayShipments++;
      } else if (orderDate >= yesterday && orderDate < today) {
        yesterdayShipments++;
      }

      totalLoad += Number(order.physicalWeight || 0);

      if (order.shippingCost !== null && order.shippingCost > 0) {
        avgShipmentCost += Number(order.shippingCost);
        shippedOrdersCount++;
      }
    });

    if (shippedOrdersCount > 0) {
      avgShipmentCost /= shippedOrdersCount;
    }
  }

  let userWalletBalance = 0;
  if (userId) {
    const dbWallet = await prisma.wallet.findUnique({
      where: { userId: Number(userId) },
      select: { balance: true },
    });
    userWalletBalance = dbWallet?.balance ?? 0;
  }

  const actionableAlerts: string[] = [];
  const ndrCount = statusCounts["undelivered"] || 0;
  const failedPickupCount = statusCounts["manifest_failed"] || 0;

  if (ndrCount > 0) {
    actionableAlerts.push(
      `${ndrCount} order${ndrCount > 1 ? "s" : ""} stuck in NDR`
    );
  }

  if (failedPickupCount > 0) {
    actionableAlerts.push(
      `${failedPickupCount} pickup${failedPickupCount > 1 ? "s" : ""} failed`
    );
  }

  if (userWalletBalance < 500) {
    actionableAlerts.push(`Wallet low (₹${userWalletBalance.toFixed(2)})`);
  }

  const shipmentCards = [
    {
      title: "Total Shipment",
      value: totalShipments.toString(),
      info: "Last 30 days",
      color: "bg-[linear-gradient(to_right,#7f12e1,#3e0ead)] rounded-xl p-4 shadow-lg",
      icon: <Package className="h-6 w-6 text-white" />,
      link: "/user/dashboard/reports",
    },
    {
      title: "Today Shipment",
      value: todayShipments.toString(),
      info: new Date().toLocaleDateString(),
      color: "bg-[linear-gradient(to_right,#3b82f6,#1e40af)] rounded-xl p-4 shadow-lg",
      icon: <Truck className="h-6 w-6 text-white" />,
      link: "/user/dashboard/reports",
    },
    {
      title: "Yesterday Shipment",
      value: yesterdayShipments.toString(),
      info: new Date(Date.now() - 86400000).toLocaleDateString(),
      color: "bg-[linear-gradient(to_right,#6366f1,#312e81)] rounded-xl p-4 shadow-lg",
      icon: <Info className="h-6 w-6 text-white" />,
      link: "/user/dashboard/reports",
    },
    {
      title: "Total Load",
      value: `${totalLoad.toFixed(2)} Kg`,
      info: "In Kg",
      color: "bg-[linear-gradient(to_right,#f97316,#c2410c)] rounded-xl p-4 shadow-lg",
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      link: "",
    },
    {
      title: "Avg. Shipment Cost",
      value: `₹${avgShipmentCost.toFixed(2)}`,
      info: "Per Shipment",
      color: "bg-[linear-gradient(to_right,#22c55e,#15803d)] rounded-xl p-4 shadow-lg",
      icon: <Calculator className="h-6 w-6 text-white" />,
      link: "#",
    },
  ];

  const getStatusCount = (statuses: string[]) => {
    return statuses.reduce(
      (acc, status) => acc + (statusCounts[status] || 0),
      0
    );
  };

  const calculatePercentage = (count: number) => {
    return totalShipments > 0
      ? `${((count / totalShipments) * 100).toFixed(0)}%`
      : "0%";
  };

  const statusCardData = [
    {
      status: "Unshipped",
      dbStatuses: ["unshipped"],
      color: "bg-gray-100 dark:bg-gray-800",
    },
    {
      status: "Pickup Scheduled",
      dbStatuses: ["pending_manifest", "manifested"],
      color: "bg-red-100 dark:bg-red-900/20",
    },
    {
      status: "In-Transit",
      dbStatuses: ["in_transit"],
      color: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      status: "Delivered",
      dbStatuses: ["delivered"],
      color: "bg-green-100 dark:bg-green-900/20",
    },
    {
      status: "Un-Delivered",
      dbStatuses: ["undelivered"],
      color: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      status: "OFD",
      dbStatuses: ["out_for_delivery"],
      color: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      status: "RTO In-Transit",
      dbStatuses: ["rto_intransit"],
      color: "bg-white dark:bg-gray-800",
    },
    {
      status: "RTO Delivered",
      dbStatuses: ["rto_delivered"],
      color: "bg-white dark:bg-gray-800",
    },
    {
      status: "LOST Shipments",
      dbStatuses: ["lost_shipment"],
      color: "bg-white dark:bg-gray-800",
    },
  ];

  const statusCards = statusCardData.map((card) => {
    const count = getStatusCount(card.dbStatuses);

    return {
      count: count.toString(),
      percentage: calculatePercentage(count),
      status: card.status,
      color: card.color,
      dbStatuses: card.dbStatuses,
    };
  });

  const chartData = statusCards
    .filter((card) => Number(card.count) > 0)
    .map((card) => {
      let hexColor = "#818cf8";

      if (card.color.includes("gray")) hexColor = "#9ca3af";
      if (card.color.includes("red")) hexColor = "#f43f5e";
      if (card.color.includes("yellow")) hexColor = "#f59e0b";
      if (card.color.includes("green")) hexColor = "#10b981";
      if (card.color.includes("blue")) hexColor = "#0ea5e9";
      if (card.color.includes("purple")) hexColor = "#a855f7";

      return {
        name: card.status,
        value: Number(card.count),
        color: hexColor,
      };
    });

  return (
    <main className="px-4 pb-8 md:px-8">
      {activeBanner && (
        <div
          className={`${activeBanner.backgroundColor} mb-2 mt-4 flex w-full cursor-pointer items-center justify-start gap-3 rounded-xl px-4 py-3 text-[13px] text-white shadow-md transition-all hover:shadow-lg sm:text-sm`}
        >
          <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
          <div
            className="w-full tracking-wide"
            dangerouslySetInnerHTML={{ __html: activeBanner.content }}
          />
        </div>
      )}

      <DashboardWelcome name={firstName} />
      <DashboardHorizontalNavUser />

      <div className="mx-auto max-w-full">
        <div className="mb-8 grid grid-cols-2 gap-3 pt-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {shipmentCards.map((card, index) => (
            <ShipmentCard key={index} {...card} />
          ))}
        </div>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col gap-6 lg:w-2/3">
            {actionableAlerts.length > 0 && (
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm dark:bg-amber-950/30">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                      Action Required
                    </h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      <ul className="list-inside list-disc space-y-1">
                        {actionableAlerts.map((alert, index) => (
                          <li key={index}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <KycAlertBanner />

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#495057] dark:text-gray-100">
                  Shipment Details
                </h2>
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  Last 30 days
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
                {statusCards.map((card, index) => (
                  <StatusCard key={index} {...card} />
                ))}
              </div>
            </div>

            {totalShipments > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-6 text-xl font-bold text-[#495057] dark:text-gray-100">
                  Shipment Analytics
                </h2>

                <div className="h-[300px] w-full sm:h-[400px]">
                  <ShipmentChart chartData={chartData} />
                </div>
              </div>
            )}
          </div>

          <div className="h-[65dvh] overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900 lg:w-1/3">
            <NewsSection />
          </div>
        </div>
      </div>

      <WhatsAppChat />
    </main>
  );
}