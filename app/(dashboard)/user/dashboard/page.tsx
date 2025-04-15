"use client"

import React from 'react';
import { Package, Truck, Info, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

interface ShipmentCardProps {
  title: string;
  value: string;
  info: string;
  color: string;
  icon: React.ReactNode;
}

function ShipmentCard({ title, value, info, color, icon }: ShipmentCardProps) {
  return (
    <div className={`${color} rounded-lg p-6 text-white transition-transform hover:scale-105 duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-sm mt-4 opacity-90">{info}</p>
    </div>
  );
}

interface StatusCardProps {
  count: string;
  percentage: string;
  status: string;
  color: string;
}

function StatusCard({ count, percentage, status, color }: StatusCardProps) {
  return (
    <div className={`${color} rounded-lg p-6 transition-all hover:shadow-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{count}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{percentage}</p>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{status}</span>
      </div>
      <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`bg-indigo-600 h-1.5 rounded-full w-${percentage}`}
        ></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const shipmentCards = [
    { title: "Total Shipment", value: "1", info: "Last 30 days", color: "bg-purple-600", icon: <Package className="h-6 w-6 text-white" /> },
    { title: "Today Shipment", value: "0", info: "20-12-2024", color: "bg-blue-500", icon: <Truck className="h-6 w-6 text-white" /> },
    { title: "Yesterday Shipment", value: "0", info: "19-12-2024", color: "bg-indigo-600", icon: <Info className="h-6 w-6 text-white" /> },
    { title: "Total Load", value: "0", info: "In Kg", color: "bg-orange-500", icon: <TrendingUp className="h-6 w-6 text-white" /> },
    { title: "Avg. Shipment Cost", value: "0", info: "Know More", color: "bg-green-500", icon: <Calculator className="h-6 w-6 text-white" /> },
  ];

  const statusCards = [
    { count: "1", percentage: "100%", status: "Unshipped", color: "bg-gray-100 dark:bg-gray-800" },
    { count: "0", percentage: "0%", status: "Pickup Scheduled", color: "bg-red-100 dark:bg-red-900/20" },
    { count: "0", percentage: "0%", status: "In-Transit", color: "bg-yellow-100 dark:bg-yellow-900/20" },
    { count: "0", percentage: "0%", status: "Delivered", color: "bg-green-100 dark:bg-green-900/20" },
    { count: "0", percentage: "0%", status: "Un-Delivered", color: "bg-blue-100 dark:bg-blue-900/20" },
    { count: "0", percentage: "0%", status: "OFD", color: "bg-purple-100 dark:bg-purple-900/20" },
  ];

  const shipmentNews = [
    "New feature: Track multiple shipments at once with our bulk tracking tool",
    "Holiday season shipping deadlines announced - Plan your deliveries",
    "System maintenance scheduled for next weekend",
    "New partnership with major courier service announced",
    "Updated shipping rates for international destinations",
  ];

  return (
    <main className="pt-20 px-4 md:px-8 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Shipment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {shipmentCards.map((card, index) => (
            <ShipmentCard key={index} {...card} />
          ))}
        </div>

        {/* Shipment Details */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Shipment Details
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                Last 30 days
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusCards.map((card, index) => (
              <StatusCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Shipment News */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipment News</h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {shipmentNews.map((news, index) => (
                <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">{news}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}