"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Copy,
  Trash2,
  Search,
  Plus,
  Package,
  Home,
  ChevronRight,
  Download,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Clock,
  User,
  Phone,
  ArrowRight,
  TrendingDown,
  Truck,
  Eye,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderItem {
  productName: string;
  quantity: number;
  orderValue: number;
  hsn?: string;
}

interface Order {
  id: string;
  courierName?: string;
  items: OrderItem[];
  mobile: string;
  awbNumber: string;
  customerName: string;
  attempts?: number | string;
  paymentMode?: string;
  orderDate?: string;
  ageing?: number | string;
  remarks?: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  orderId?: string;
  billableWeight?: number | string;
  shippingDetails?: string;
  physicalWeight?: number | string;
  updatedAt?: string;
  address?: string;
  pickupLocation?: string;
  ndrReason?: string;
  ndrAction?: string;
  ndrActionRemarks?: string;
  labelUrl?: string;
}

const SBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase() || "pending";
  const styles: Record<string, string> = {
    delivered:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    undelivered:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    rto_intransit:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    rto_delivered:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    lost_shipment:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
        styles[s] || styles.lost_shipment
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

// ─── Re-attempt Modal ────────────────────────────────────────────
const ReAttemptModal: React.FC<{
  order: Order;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  isSubmitting: boolean;
}> = ({ order, onClose, onConfirm, isSubmitting }) => {
  const [remarks, setRemarks] = useState("");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111827]">
        <div className="flex items-center justify-between bg-indigo-600 px-6 py-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Request Re-attempt
            </h3>
            <p className="mt-0.5 text-[10px] font-bold uppercase text-indigo-200">
              AWB: {order.awbNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
            <Package className="h-8 w-8 shrink-0 text-gray-400" />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold uppercase text-gray-900 dark:text-white">
                {order.customerName}
              </div>
              <div className="text-[10px] font-medium text-gray-500">
                Order: {order.orderId} • {order.courierName}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              Delivery Instructions (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Call customer before delivery, deliver after 6 PM, try alternate number..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              ⚡ This will instruct the courier to attempt delivery again. The
              order will move to "Action Requested" tab.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 rounded-xl border border-gray-200 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(remarks)}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 rounded-xl bg-indigo-600 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? "Submitting..." : "Confirm Re-attempt"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RTO Confirmation Modal ──────────────────────────────────────
const RTOConfirmModal: React.FC<{
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}> = ({ order, onClose, onConfirm, isSubmitting }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111827]">
        <div className="space-y-4 p-6 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/30">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">
              Mark as RTO?
            </h3>
            <p className="mt-1 text-[12px] font-medium text-gray-500">
              Order <span className="font-black text-indigo-600">{order.orderId}</span>{" "}
              will be sent back to origin. This action cannot be undone easily.
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left dark:border-rose-800 dark:bg-rose-900/20">
            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
              ⚠️ The courier will stop delivery attempts and return the shipment
              to your warehouse.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 rounded-xl border border-gray-200 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 rounded-xl bg-rose-600 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? "Processing..." : "Confirm RTO"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────
const NDRUserDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("AWB No");
  const [activeTab, setActiveTab] = useState("Action Required");
  const [currentPage, setCurrentPage] = useState(1);
  const [reAttemptOrder, setReAttemptOrder] = useState<Order | null>(null);
  const [rtoOrder, setRtoOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 15;

  const tabs = [
    { name: "Action Required", icon: AlertCircle },
    { name: "Action Requested", icon: Clock },
    { name: "Delivered", icon: CheckCircle2 },
    { name: "RTO", icon: XCircle },
    { name: "All", icon: Package },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/user/orders/ndr");
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error("Failed to load NDR orders.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalOrderValue = (items: OrderItem[]): number => {
    return (
      items?.reduce((sum, item) => sum + item.orderValue * item.quantity, 0) || 0
    );
  };

  // ── NDR Actions ──
  const handleReAttempt = async (remarks: string) => {
    if (!reAttemptOrder) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/user/orders/ndr/action", {
        orderId: reAttemptOrder.id,
        action: "re-attempt",
        remarks,
      });
      toast.success(`Re-attempt requested for ${reAttemptOrder.orderId}`);
      setReAttemptOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to submit re-attempt request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRTO = async () => {
    if (!rtoOrder) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/user/orders/ndr/action", {
        orderId: rtoOrder.id,
        action: "rto",
      });
      toast.success(`Order ${rtoOrder.orderId} marked for RTO.`);
      setRtoOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to mark order as RTO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (activeTab === "Action Required") {
      result = orders.filter((o) => o.status === "undelivered" && !o.ndrAction);
    } else if (activeTab === "Action Requested") {
      result = orders.filter(
        (o) => o.status === "undelivered" && o.ndrAction === "re-attempt"
      );
    } else if (activeTab === "Delivered") {
      result = orders.filter((o) => o.status === "delivered");
    } else if (activeTab === "RTO") {
      result = orders.filter((o) => o.status.includes("rto") || o.ndrAction === "rto");
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((order) => {
        switch (searchType) {
          case "AWB No":
            return (order.awbNumber || "").toLowerCase().includes(q);
          case "Order ID":
            return (order.orderId || "").toLowerCase().includes(q);
          case "Mobile No":
            return (order.mobile || "").toLowerCase().includes(q);
          case "Customer":
            return (order.customerName || "").toLowerCase().includes(q);
          default:
            return true;
        }
      });
    }

    return result;
  }, [orders, searchQuery, searchType, activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabCounts = useMemo(
    () => ({
      "Action Required": orders.filter((o) => o.status === "undelivered" && !o.ndrAction)
        .length,
      "Action Requested": orders.filter(
        (o) => o.status === "undelivered" && o.ndrAction === "re-attempt"
      ).length,
      Delivered: orders.filter((o) => o.status === "delivered").length,
      RTO: orders.filter((o) => o.status.includes("rto") || o.ndrAction === "rto")
        .length,
      All: orders.length,
    }),
    [orders]
  );

  const downloadCSV = (ordersToDownload: Order[]) => {
    const headers = [
      "Date",
      "Order ID",
      "Waybill",
      "Customer",
      "Value",
      "Status",
      "Reason",
      "Action Taken",
    ];

    const rows = ordersToDownload.map((order) => [
      order.orderDate || "—",
      order.orderId || "—",
      order.awbNumber || "—",
      order.customerName,
      calculateTotalOrderValue(order.items).toFixed(2),
      order.status,
      order.ndrReason || "—",
      order.ndrAction || "Pending",
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NDR_Report.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#10162A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#0a0c37] dark:text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
            Initialising NDR Cabinet...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c1a]">
      {reAttemptOrder && (
        <ReAttemptModal
          order={reAttemptOrder}
          onClose={() => setReAttemptOrder(null)}
          onConfirm={handleReAttempt}
          isSubmitting={isSubmitting}
        />
      )}

      {rtoOrder && (
        <RTOConfirmModal
          order={rtoOrder}
          onClose={() => setRtoOrder(null)}
          onConfirm={handleRTO}
          isSubmitting={isSubmitting}
        />
      )}

      <main className="p-4 lg:p-10">
        <div className="mx-auto max-w-full">
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="min-w-0 flex-col gap-1">
              <h2 className="cursor-default text-2xl font-black tracking-tight text-[#0a0c37] drop-shadow-sm transition-all hover:translate-x-1 dark:text-white uppercase">
                NDR Portfolio
              </h2>
              <div className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-gray-400">
                <Link
                  href="/user/dashboard"
                  className="cursor-pointer transition-colors hover:text-[#0a0c37] dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="cursor-default text-[#0a0c37] dark:text-indigo-400">
                  Non-Delivery Reports
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => downloadCSV(filteredOrders)}
                className="cursor-pointer flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:shadow-md active:scale-95 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-100/50 p-1.5 dark:border-gray-800 dark:bg-gray-900/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              const count = tabCounts[tab.name as keyof typeof tabCounts] || 0;

              return (
                <button
                  key={tab.name}
                  onClick={() => {
                    setActiveTab(tab.name);
                    setCurrentPage(1);
                  }}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-[#0a0c37] text-white shadow-xl shadow-indigo-500/10"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} />
                  {tab.name}
                  <span
                    className={`ml-1 rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111827] md:flex-row">
            <div className="flex w-full flex-1 items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 transition-all focus-within:ring-2 focus-within:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-800/30">
              <div className="relative min-w-[140px] border-r border-gray-200 dark:border-gray-700">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none bg-transparent px-4 pr-10 text-[11px] font-black uppercase tracking-wider text-gray-500 outline-none"
                >
                  <option>AWB No</option>
                  <option>Order ID</option>
                  <option>Mobile No</option>
                  <option>Customer</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="relative flex flex-1 items-center">
                <Search className="absolute left-4 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search in ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full bg-transparent pl-11 pr-4 text-[13px] font-medium text-gray-700 outline-none dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111827] lg:block">
            <div className="custom-scrollbar w-full max-h-[calc(100vh-420px)] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 whitespace-nowrap text-left">
                <thead className="sticky top-0 z-40 bg-[#0a0c37] shadow-sm">
                  <tr className="text-white">
                    <th className="border-b border-gray-800 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Picked On
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Order ID
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Products
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Value / Pay
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Consignee
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Waybill (AWB)
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Atmpts / Ageing
                    </th>
                    <th className="border-b border-gray-800 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-200">
                      Status
                    </th>
                    <th className="sticky right-0 z-50 border-b border-l border-gray-800 bg-[#0a0c37] px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-200 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.4)]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedOrders.map((order) => {
                    const totalValue = calculateTotalOrderValue(order.items);
                    const hasAction = !!order.ndrAction;

                    return (
                      <tr
                        key={order.id}
                        className="group relative cursor-pointer align-top transition-colors hover:bg-slate-50 dark:hover:bg-indigo-950/10"
                      >
                        <td className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                          <div className="text-[12px] font-medium text-gray-500">
                            {order.orderDate
                              ? new Date(order.orderDate).toLocaleDateString("en-GB")
                              : "—"}
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800">
                          <span className="inline-flex rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[11px] font-black uppercase tracking-tighter text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {order.orderId || "—"}
                          </span>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 whitespace-normal min-w-[200px] dark:border-gray-800">
                          <div className="text-[12px] font-bold text-[#0a0c37] dark:text-gray-200">
                            {order.items[0]?.productName}{" "}
                            <span className="text-gray-400">
                              x{order.items[0]?.quantity}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] font-bold uppercase text-gray-400 opacity-60">
                            {order.length ? `${order.length}x${order.breadth}x${order.height}cm` : ""}
                            {order.physicalWeight ? ` | ${order.physicalWeight}Kg` : ""}
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800">
                          <div className="text-[13px] font-black text-emerald-600">
                            ₹{totalValue.toLocaleString("en-IN")}
                          </div>
                          <div className="mt-1 text-[9px] font-bold uppercase text-gray-400">
                            {order.paymentMode}
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                          <div className="text-[13px] font-bold uppercase text-gray-900 dark:text-white">
                            {order.customerName}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium tracking-tighter text-gray-500">
                            <Phone className="h-3 w-3 opacity-30" />
                            {order.mobile}
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 leading-tight dark:border-gray-800">
                          <div className="mb-1 inline-block rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-black text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {order.awbNumber || "PENDING"}
                          </div>
                          <div className="ml-0.5 text-[9px] font-black uppercase text-gray-400">
                            {order.courierName || "ASSIGNING..."}
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800">
                          <div className="text-[10px] font-black uppercase text-gray-400">
                            Atmpt:{" "}
                            <span className="text-gray-900 dark:text-white">
                              {order.attempts || 0}
                            </span>
                          </div>
                          <div className="text-[10px] font-black uppercase text-gray-400">
                            Age:{" "}
                            <span className="text-rose-600">{order.ageing || 0}d</span>
                          </div>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800">
                          <SBadge status={order.status} />
                          {hasAction && (
                            <div className="mt-1 text-[8px] font-black uppercase text-indigo-500">
                              {order.ndrAction}
                            </div>
                          )}
                        </td>

                        <td className="sticky right-0 z-20 border-b border-l border-gray-100 bg-white px-4 py-4 text-center shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:border-gray-800 dark:bg-[#111827] dark:group-hover:bg-indigo-900/20">
                          {order.status === "undelivered" && !hasAction ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setReAttemptOrder(order)}
                                className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                              >
                                Re-attempt
                              </button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="cursor-pointer rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 p-1">
                                  <DropdownMenuItem
                                    onClick={() => setRtoOrder(order)}
                                    className="cursor-pointer gap-2 py-2 text-[11px] font-bold uppercase text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/30"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Return (RTO)
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : hasAction ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                                order.ndrAction === "re-attempt"
                                  ? "border border-indigo-100 bg-indigo-50 text-indigo-600"
                                  : "border border-rose-100 bg-rose-50 text-rose-600"
                              }`}
                            >
                              {order.ndrAction === "re-attempt" ? (
                                <RefreshCw className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {order.ndrAction === "re-attempt"
                                ? "Requested"
                                : "RTO Filed"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-8 py-4 dark:border-gray-800 dark:bg-[#0d111c]">
              <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Showing{" "}
                <span className="px-1 text-gray-900 dark:text-white">
                  {paginatedOrders.length}
                </span>{" "}
                of {filteredOrders.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800"
                >
                  Prev
                </button>
                <div className="flex h-9 min-w-[40px] items-center justify-center rounded-lg bg-[#0a0c37] text-[11px] font-black text-white">
                  {currentPage}
                </div>
                <button
                  disabled={currentPage === totalPages || filteredOrders.length === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:hidden">
            {paginatedOrders.map((order) => {
              const hasAction = !!order.ndrAction;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all dark:border-gray-800 dark:bg-[#111827]"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="inline-flex rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {order.orderId || "—"}
                      </span>
                      <div className="text-[9px] font-black uppercase text-gray-400 ml-0.5">
                        AWB: {order.awbNumber || "NO AWB"}
                      </div>
                    </div>
                    <SBadge status={order.status} />
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold uppercase text-[#0a0c37] dark:text-gray-100">
                        {order.items[0]?.productName} x{order.items[0]?.quantity}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        ₹{calculateTotalOrderValue(order.items).toLocaleString("en-IN")} •{" "}
                        {order.paymentMode}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-3 dark:border-gray-800">
                    <div>
                      <span className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Consignee
                      </span>
                      <div className="truncate text-[12px] font-bold uppercase text-gray-700 dark:text-gray-200">
                        {order.customerName}
                      </div>
                    </div>

                    <div>
                      <span className="mb-0.5 block text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Atmpts / Ageing
                      </span>
                      <div className="text-[11px] font-black uppercase tracking-tighter text-gray-600 dark:text-gray-300">
                        {order.attempts || 0} Tr • {order.ageing || 0} D
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {order.status === "undelivered" && !hasAction ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReAttemptOrder(order)}
                          className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
                        >
                          Re-attempt Now
                        </button>
                        <button
                          onClick={() => setRtoOrder(order)}
                          className="cursor-pointer rounded-lg border border-rose-200 p-2.5 text-rose-500 transition-all hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : hasAction ? (
                      <div
                        className={`rounded-lg py-2 text-center text-[10px] font-black uppercase tracking-widest ${
                          order.ndrAction === "re-attempt"
                            ? "border border-indigo-100 bg-indigo-50 text-indigo-600"
                            : "border border-rose-100 bg-rose-50 text-rose-600"
                        }`}
                      >
                        {order.ndrAction === "re-attempt"
                          ? "✓ Re-attempt Requested"
                          : "✗ RTO Filed"}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-24 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                <TrendingDown className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-gray-800 dark:text-white">
                Clean Cabinet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm font-medium tracking-tight text-gray-400">
                No shipments need your attention in this category.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NDRUserDashboardPage;