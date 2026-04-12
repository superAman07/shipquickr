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
  Building,
} from "lucide-react";
import Link from "next/link";

interface PendingUser {
  user: { id: number; firstName: string; lastName: string; email: string };
  orders: any[];
  totalCod: number;
  totalFreight: number;
}

interface RemittanceRecord {
  id: number;
  remittanceDate: string;
  utrReference: string;
  collectableValue: number;
  netOffAmount: number;
  codPaid: number;
  user: { firstName: string; lastName: string };
  _count: { orders: number };
}

export default function AdminRemittancePage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingData, setPendingData] = useState<PendingUser[]>([]);
  const [historyData, setHistoryData] = useState<RemittanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [remitModalOpen, setRemitModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [utr, setUtr] = useState("");
  const [remitDate, setRemitDate] = useState("");

  const fetchData = async () => {
    setLoading(true);

    try {
      if (activeTab === "pending") {
        const res = await axios.get("/api/admin/remittance/pending");
        setPendingData(res.data.data || []);
      } else {
        const res = await axios.get("/api/admin/remittance");
        setHistoryData(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching remittance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenRemitModal = (sellerGroup: PendingUser) => {
    setSelectedUser(sellerGroup);
    setUtr("");
    setRemitDate(new Date().toISOString().split("T")[0]);
    setRemitModalOpen(true);
  };

  const submitRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !utr || !remitDate) return;

    setSubmitting(true);

    try {
      const payload = {
        userId: selectedUser.user.id,
        orderIds: selectedUser.orders.map((o: any) => o.id),
        utrReference: utr,
        remittanceDate: new Date(remitDate).toISOString(),
      };

      await axios.post("/api/admin/remittance", payload);
      setRemitModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error("Failed to process remittance", error);
      alert("Failed to process remittance. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50/50 p-4 dark:bg-[#0a0c1a] lg:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-500/5 blur-3xl dark:bg-indigo-500/10" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#0a0c37] drop-shadow-sm dark:text-white">
              COD Remittance Management
            </h2>

            <div className="mt-1 flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-gray-400">
              <Link
                href="/admin/dashboard"
                className="cursor-pointer transition-colors hover:text-[#0a0c37] dark:hover:text-white"
              >
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#0a0c37] dark:text-indigo-400">
                Remittance
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px dark:border-gray-800">
          <button
            onClick={() => setActiveTab("pending")}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
              activeTab === "pending"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Pending COD Payouts
            {activeTab === "pending" && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-t-sm bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
              activeTab === "history"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Remittance History
            {activeTab === "history" && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-t-sm bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : activeTab === "pending" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0a0c37] text-[10px] font-black uppercase tracking-widest text-white">
                  <tr>
                    <th className="rounded-tl-sm px-6 py-4">Seller Details</th>
                    <th className="px-6 py-4">Delivered Orders</th>
                    <th className="px-6 py-4">Total COD Amount</th>
                    <th className="px-6 py-4">Freight Deductions</th>
                    <th className="px-6 py-4">Net Payable</th>
                    <th className="rounded-tr-sm px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {pendingData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center font-medium text-gray-500"
                      >
                        All sellers have been paid. No pending remittances!
                      </td>
                    </tr>
                  ) : (
                    pendingData.map((data) => {
                      const netPayable = data.totalCod - data.totalFreight;

                      return (
                        <tr
                          key={data.user.id}
                          className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-indigo-50 dark:bg-indigo-900/30">
                                <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                  {data.user.firstName} {data.user.lastName}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {data.user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600 dark:bg-blue-900/30">
                              {data.orders.length} AWBs
                            </span>
                          </td>

                          <td className="px-6 py-4 font-bold text-[#0a0c37] dark:text-gray-200">
                            ₹{data.totalCod.toFixed(2)}
                          </td>

                          <td className="px-6 py-4 font-medium text-rose-500">
                            - ₹{data.totalFreight.toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex w-max items-center rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900/30 dark:bg-emerald-900/20">
                              <span className="text-[13px] font-black text-emerald-700 dark:text-emerald-400">
                                ₹{netPayable.toFixed(2)}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenRemitModal(data)}
                              className="rounded-sm bg-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-700"
                            >
                              Remit Now
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0a0c37] text-[10px] font-black uppercase tracking-widest text-white">
                  <tr>
                    <th className="rounded-tl-sm px-6 py-4">UTR Reference</th>
                    <th className="px-6 py-4">Seller</th>
                    <th className="px-6 py-4">Remittance Date</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Total Val</th>
                    <th className="px-6 py-4">Net Payout</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center font-medium text-gray-500"
                      >
                        No remittance history found.
                      </td>
                    </tr>
                  ) : (
                    historyData.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-mono font-bold uppercase text-gray-900 dark:text-gray-100">
                              {item.utrReference}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-600 dark:text-gray-300">
                          {item.user.firstName} {item.user.lastName}
                        </td>

                        <td className="px-6 py-4 text-[12px] font-medium text-gray-500">
                          {format(new Date(item.remittanceDate), "dd MMM yyyy")}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-[12px] font-bold text-gray-600 dark:text-gray-400">
                            {item._count.orders} Orders
                          </span>
                        </td>

                        <td className="px-6 py-4 text-[13px] font-medium text-gray-500">
                          ₹{item.collectableValue.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-[14px] font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                          ₹{item.codPaid.toFixed(2)}
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

      {remitModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111827]">
            <div className="rounded-t-md border-b border-gray-100 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-[#0a0c1a]">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#0a0c37] dark:text-white">
                <Wallet className="h-5 w-5 text-indigo-600" />
                Process Remittance
              </h3>
            </div>

            <form onSubmit={submitRemittance} className="space-y-5 p-5">
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Payout Summary
                </p>

                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-gray-500">
                    Seller:
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                    {selectedUser.user.firstName}
                  </span>
                </div>

                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-gray-500">
                    Total COD Collected:
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                    ₹{selectedUser.totalCod.toFixed(2)}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-gray-500">
                    Freight Deductions:
                  </span>
                  <span className="text-[13px] font-bold text-rose-500">
                    - ₹{selectedUser.totalFreight.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                  <span className="text-[12px] font-black uppercase tracking-widest text-gray-400">
                    Net Payable:
                  </span>
                  <span className="text-[16px] font-black text-emerald-600">
                    ₹{(selectedUser.totalCod - selectedUser.totalFreight).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Bank UTR / Transaction Ref ID
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="block w-full rounded-sm border border-gray-200 bg-white p-3 pl-10 font-mono text-[13px] font-medium text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g. HDFC123456789"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Remittance Date
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={remitDate}
                    onChange={(e) => setRemitDate(e.target.value)}
                    className="block w-full rounded-sm border border-gray-200 bg-white p-3 pl-10 text-[13px] font-medium text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setRemitModalOpen(false)}
                  className="flex-1 rounded-sm border border-gray-200 bg-white py-3 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-indigo-600 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Mark Remitted"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}