"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Wallet,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronRight,
  TrendingDown,
  Clock,
  ArrowDownToLine,
} from "lucide-react";
import Link from "next/link";

interface RemittanceRecord {
  id: number;
  remittanceDate: string;
  utrReference: string;
  collectableValue: number;
  netOffAmount: number;
  codPaid: number;
  _count: { orders: number };
}

interface Stats {
  pendingCod: number;
  pendingFreight: number;
  pendingPayable: number;
  pendingCount: number;
  totalRemitted: number;
}

export default function UserRemittancePage() {
  const [historyData, setHistoryData] = useState<RemittanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingCod: 0,
    pendingFreight: 0,
    pendingPayable: 0,
    pendingCount: 0,
    totalRemitted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await axios.get("/api/user/remittance");
        if (res.data.success) {
          setHistoryData(res.data.data.history || []);
          setStats(res.data.data.stats);
        }
      } catch (error) {
        console.error("Error fetching user remittance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50/50 p-4 dark:bg-[#0a0c1a] lg:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#0a0c37] drop-shadow-sm dark:text-white">
              COD Remittance Ledger
            </h2>

            <div className="mt-1 flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-gray-400">
              <Link
                href="/user/dashboard"
                className="cursor-pointer transition-colors hover:text-[#0a0c37] dark:hover:text-white"
              >
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#0a0c37] dark:text-emerald-500">
                Remittance
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Total Remitted
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#0a0c37] dark:text-white">
                    ₹{stats.totalRemitted.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Pending COD Total
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#0a0c37] dark:text-white">
                    ₹{stats.pendingCod.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-gray-500">
                  From {stats.pendingCount} delivered orders
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-blue-50 dark:bg-blue-900/30">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Net Off Amount
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-rose-500">
                    - ₹{stats.pendingFreight.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-rose-50 dark:bg-rose-900/30">
                <TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[120%] w-[120%] bg-gradient-to-br from-emerald-400/10 to-transparent" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Net Pending Payable
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-700 dark:text-white">
                    ₹{stats.pendingPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-100 dark:bg-emerald-800/50">
                <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
          <div className="flex items-center justify-between rounded-t-sm border-b border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Settlement History
            </h3>
            <span className="text-[11px] font-medium text-gray-500">
              Showing {historyData.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0a0c37] text-[10px] font-black uppercase tracking-widest text-white">
                  <tr>
                    <th className="px-6 py-4 text-center">Date</th>
                    <th className="px-6 py-4">UTR Reference</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Total COD</th>
                    <th className="px-6 py-4">Net Off</th>
                    <th className="px-6 py-4 text-right">Amount Credited</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {historyData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Wallet className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                          <p className="text-[13px] font-bold text-gray-600 dark:text-gray-400">
                            No Remittance History
                          </p>
                          <p className="text-[11px]">
                            Your settlements will appear here once processed by the admin.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historyData.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-bold text-gray-700 dark:text-gray-200">
                              {format(new Date(item.remittanceDate), "dd MMM yyyy")}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-mono font-bold uppercase text-[#0a0c37] dark:text-gray-200">
                              {item.utrReference}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-sm bg-blue-50 px-2 py-1 text-[12px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {item._count.orders} Orders
                          </span>
                        </td>

                        <td className="px-6 py-4 text-[13px] font-bold text-gray-600 dark:text-gray-300">
                          ₹{item.collectableValue.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-[13px] font-bold text-rose-500">
                          - ₹{item.netOffAmount.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 text-[15px] font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            <ArrowDownToLine className="h-4 w-4" />
                            ₹{item.codPaid.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}