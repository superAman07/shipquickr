"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Package,
  Pencil,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";

interface OrderDetail {
  id: number;
  orderId: string;
  awbNumber: string | null;
  codAmount: number | null;
  shippingCost: number | null;
  courierName: string | null;
  customerName: string;
}

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
  remarks: string | null;
  user: { firstName: string; lastName: string };
  orders: OrderDetail[];
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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RemittanceRecord | null>(
    null
  );
  const [editUtr, setEditUtr] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      await axios.post("/api/admin/remittance", {
        userId: selectedUser.user.id,
        orderIds: selectedUser.orders.map((o: any) => o.id),
        utrReference: utr,
        remittanceDate: new Date(remitDate).toISOString(),
      });
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

  const handleOpenEditModal = (record: RemittanceRecord) => {
    setEditingRecord(record);
    setEditUtr(record.utrReference);
    setEditDate(new Date(record.remittanceDate).toISOString().split("T")[0]);
    setEditRemarks(record.remarks || "");
    setEditModalOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setSubmitting(true);

    try {
      await axios.put("/api/admin/remittance", {
        remittanceId: editingRecord.id,
        utrReference: editUtr,
        remittanceDate: new Date(editDate).toISOString(),
        remarks: editRemarks,
      });
      setEditModalOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error("Failed to update remittance", error);
      alert("Failed to update. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = (id: number) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);

    try {
      await axios.delete(`/api/admin/remittance?id=${deletingId}`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (error) {
      console.error("Failed to reverse remittance", error);
      alert("Failed to reverse. Check console for details.");
    } finally {
      setDeleting(false);
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
            className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
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
            className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
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
                    <th className="rounded-tr-sm px-6 py-4 text-right">
                      Action
                    </th>
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
                              className="cursor-pointer rounded-sm bg-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-700"
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
                    <th className="rounded-tl-sm px-4 py-4 w-8" />
                    <th className="px-4 py-4">UTR Reference</th>
                    <th className="px-4 py-4">Seller</th>
                    <th className="px-4 py-4">Remittance Date</th>
                    <th className="px-4 py-4">Orders</th>
                    <th className="px-4 py-4">Total Val</th>
                    <th className="px-4 py-4">Net Payout</th>
                    <th className="rounded-tr-sm px-4 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center font-medium text-gray-500"
                      >
                        No remittance history found.
                      </td>
                    </tr>
                  ) : (
                    historyData.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              title="View linked orders"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  expandedRows.has(item.id) ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-emerald-600" />
                              <span className="font-mono font-bold uppercase text-gray-900 dark:text-gray-100">
                                {item.utrReference}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-medium text-gray-600 dark:text-gray-300">
                            {item.user.firstName} {item.user.lastName}
                          </td>

                          <td className="px-4 py-4 text-[12px] font-medium text-gray-500">
                            {format(new Date(item.remittanceDate), "dd MMM yyyy")}
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-[12px] font-bold text-gray-600 dark:text-gray-400">
                              {item._count.orders} Orders
                            </span>
                          </td>

                          <td className="px-4 py-4 text-[13px] font-medium text-gray-500">
                            ₹{item.collectableValue.toFixed(2)}
                          </td>

                          <td className="px-4 py-4 text-[14px] font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            ₹{item.codPaid.toFixed(2)}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="cursor-pointer rounded-sm border border-gray-200 p-2 text-gray-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                                title="Edit UTR / Date"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteConfirm(item.id)}
                                className="cursor-pointer rounded-sm border border-gray-200 p-2 text-gray-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-700 dark:hover:border-rose-800 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                                title="Reverse Remittance"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedRows.has(item.id) && (
                          <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                            <td colSpan={8} className="px-4 py-0">
                              <div className="py-4 pl-8">
                                <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  <Package className="h-3.5 w-3.5" />
                                  Linked Orders ({item.orders.length})
                                </p>

                                <div className="overflow-hidden rounded-sm border border-gray-200 dark:border-gray-700">
                                  <table className="w-full text-left text-[12px]">
                                    <thead className="bg-gray-100 dark:bg-gray-800">
                                      <tr className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        <th className="px-4 py-2.5">Order ID</th>
                                        <th className="px-4 py-2.5">AWB Number</th>
                                        <th className="px-4 py-2.5">Customer</th>
                                        <th className="px-4 py-2.5">Courier</th>
                                        <th className="px-4 py-2.5">COD Amount</th>
                                        <th className="px-4 py-2.5">Freight</th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                      {item.orders.map((order) => (
                                        <tr
                                          key={order.id}
                                          className="text-gray-600 dark:text-gray-300"
                                        >
                                          <td className="px-4 py-2 font-mono font-bold text-gray-800 dark:text-gray-200">
                                            {order.orderId}
                                          </td>
                                          <td className="px-4 py-2 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                                            {order.awbNumber || "—"}
                                          </td>
                                          <td className="px-4 py-2">
                                            {order.customerName}
                                          </td>
                                          <td className="px-4 py-2">
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold dark:bg-gray-800">
                                              {order.courierName || "—"}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 font-bold text-gray-800 dark:text-gray-200">
                                            ₹{(order.codAmount || 0).toFixed(2)}
                                          </td>
                                          <td className="px-4 py-2 font-medium text-rose-500">
                                            - ₹{(order.shippingCost || 0).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {item.remarks && (
                                  <p className="mt-2 text-[11px] text-gray-400">
                                    <span className="font-bold">Remarks:</span>{" "}
                                    {item.remarks}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
            <div className="flex items-center justify-between rounded-t-md border-b border-gray-100 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-[#0a0c1a]">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#0a0c37] dark:text-white">
                <Wallet className="h-5 w-5 text-indigo-600" />
                Process Remittance
              </h3>

              <button
                onClick={() => setRemitModalOpen(false)}
                className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
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
                    {selectedUser.user.firstName} {selectedUser.user.lastName}
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
                    ₹{(selectedUser.totalCod - selectedUser.totalFreight).toFixed(
                      2
                    )}
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
                  onClick={() => setRemitModalOpen(false)}
                  className="flex-1 cursor-pointer rounded-sm border border-gray-200 bg-white py-3 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-indigo-600 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
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

      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between rounded-t-md border-b border-gray-100 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-[#0a0c1a]">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#0a0c37] dark:text-white">
                <Pencil className="h-5 w-5 text-indigo-600" />
                Edit Remittance
              </h3>

              <button
                onClick={() => setEditModalOpen(false)}
                className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-5 p-5">
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-gray-500">
                    Remittance ID:
                  </span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    #{editingRecord.id}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-gray-500">Seller:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {editingRecord.user.firstName} {editingRecord.user.lastName}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-gray-500">Net Payout:</span>
                  <span className="font-black text-emerald-600">
                    ₹{editingRecord.codPaid.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  UTR Reference
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editUtr}
                    onChange={(e) => setEditUtr(e.target.value)}
                    className="block w-full rounded-sm border border-gray-200 bg-white p-3 pl-10 font-mono text-[13px] font-medium text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="block w-full rounded-sm border border-gray-200 bg-white p-3 pl-10 text-[13px] font-medium text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Remarks (optional)
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={2}
                  className="block w-full rounded-sm border border-gray-200 bg-white p-3 text-[13px] font-medium text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g. Corrected UTR number..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 cursor-pointer rounded-sm border border-gray-200 bg-white py-3 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-indigo-600 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111827]">
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
                <AlertTriangle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>

              <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-[#0a0c37] dark:text-white">
                Reverse Remittance?
              </h3>

              <p className="mb-6 text-[13px] leading-relaxed text-gray-500">
                This will{" "}
                <span className="font-bold text-rose-500">permanently delete</span>{" "}
                this remittance record and move all linked orders back to the{" "}
                <span className="font-bold">Pending COD Payouts</span> tab. This
                action cannot be undone.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeletingId(null);
                  }}
                  disabled={deleting}
                  className="flex-1 cursor-pointer rounded-sm border border-gray-200 bg-white py-3 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  onClick={executeDelete}
                  disabled={deleting}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-rose-600 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Yes, Reverse It"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}