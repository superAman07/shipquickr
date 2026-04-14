"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Copy,
  Download,
  Home,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  XCircle,
  ChevronRight,
  MoreHorizontal,
  CheckSquare,
  X,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderDetailDrawer from "@/components/OrderDetailDrawer";

interface OrderItem {
  id?: number;
  productName: string;
  category?: string;
  quantity: number;
  orderValue: number;
  hsn?: string;
}

interface Order {
  id: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  paymentMode: string;
  customerName: string;
  mobile: string;
  email?: string;
  address: string;
  pincode?: string;
  city?: string;
  state?: string;
  pickupLocation?: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
  warehouseId?: number | string;
  awbNumber?: string;
  courierName?: string;
  labelUrl?: string;
  shippingCost?: number;
  shippingId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundDueDate?: string;
  warehouse?: { warehouseName: string; warehouseCode: string } | null;
}

type TabKey = "all" | "unshipped" | "shipped" | "cancelled";

const TABS: { key: TabKey; label: string; statuses: string[] | null }[] = [
  { key: "all", label: "All Orders", statuses: null },
  { key: "unshipped", label: "Unshipped", statuses: ["unshipped"] },
  {
    key: "shipped",
    label: "Shipped",
    statuses: [
      "shipped",
      "manifested",
      "in_transit",
      "out_for_delivery",
      "undelivered",
    ],
  },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

const SS: Record<string, { bg: string; text: string; dot: string }> = {
  unshipped: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  shipped: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  manifested: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  in_transit: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  out_for_delivery: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  delivered: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  undelivered: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
};

function gs(s: string) {
  return (
    SS[s.toLowerCase()] || {
      bg: "bg-gray-500/10",
      text: "text-gray-600 dark:text-gray-400",
      dot: "bg-gray-500",
    }
  );
}

function RefundBadge({ order }: { order: Order }) {
  if (order.refundStatus === "processed") {
    return (
      <div className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        ✅ ₹{order.refundAmount} refunded
      </div>
    );
  }

  if (order.refundStatus === "pending" && order.refundDueDate) {
    return (
      <div className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
        🕐 Refund by {new Date(order.refundDueDate).toLocaleDateString()}
      </div>
    );
  }

  return null;
}

function SBadge({ status }: { status: string }) {
  const st = gs(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

const UnifiedOrdersPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [downloadingLabelId, setDownloadingLabelId] = useState<string | null>(null);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const activeTab = (searchParams.get("tab") as TabKey) || "all";

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const url =
        tab === "all" ? "/user/dashboard/bulk" : `/user/dashboard/bulk?tab=${tab}`;
      router.replace(url, { scroll: false });
      setCurrentPage(1);
    },
    [router]
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/orders/single-order");
      setAllOrders(
        res.data.orders.map((o: any) => ({
          ...o,
          items: o.items || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const tabCfg = TABS.find((t) => t.key === activeTab) || TABS[0];
    let orders = allOrders;

    if (tabCfg.statuses) {
      orders = orders.filter((o) =>
        tabCfg.statuses!.includes(o.status.toLowerCase())
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(term) ||
          o.customerName.toLowerCase().includes(term) ||
          o.mobile.toLowerCase().includes(term) ||
          (o.awbNumber && o.awbNumber.toLowerCase().includes(term)) ||
          o.items.some((item) => item.productName.toLowerCase().includes(term))
      );
    }

    return orders;
  }, [allOrders, activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedOrders.length && !selectAllAcrossPages) {
      setSelectedIds(new Set());
      setSelectAllAcrossPages(false);
    } else {
      setSelectedIds(new Set(paginatedOrders.map((o) => o.id)));
      setSelectAllAcrossPages(false);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectAllAcrossPages(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllPageSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedIds.has(o.id));

  const effectiveSelectedOrders = selectAllAcrossPages
    ? filteredOrders
    : filteredOrders.filter((o) => selectedIds.has(o.id));

  const effectiveSelectedCount = selectAllAcrossPages
    ? filteredOrders.length
    : selectedIds.size;

  const isSomeSelected = effectiveSelectedCount > 0;

  function downloadCSV(ordersToDownload: Order[]) {
    if (!ordersToDownload.length) return;

    const headers = [
      "Order Date",
      "Order ID",
      "AWB Number",
      "Product Details",
      "Payment",
      "Order Value",
      "Customer",
      "Phone",
      "Address",
      "Pickup",
      "Status",
      "Courier",
    ];

    const rows = ordersToDownload.map((o) => [
      new Date(o.orderDate).toLocaleDateString(),
      o.orderId,
      o.awbNumber || "-",
      o.items.map((i) => `${i.productName} (${i.quantity}x)`).join("; "),
      o.paymentMode || "-",
      o.items.reduce((sum, i) => sum + i.orderValue, 0).toString(),
      o.customerName,
      o.mobile,
      o.address,
      o.warehouse?.warehouseName || "-",
      o.status,
      o.courierName || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((f) => `"${(f ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `orders-${activeTab}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const tabCounts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: 0,
      unshipped: 0,
      shipped: 0,
      cancelled: 0,
    };

    c.all = allOrders.length;

    allOrders.forEach((o) => {
      const s = o.status.toLowerCase();

      if (s === "unshipped") {
        c.unshipped++;
      } else if (
        [
          "shipped",
          "manifested",
          "in_transit",
          "out_for_delivery",
          "undelivered",
        ].includes(s)
      ) {
        c.shipped++;
      } else if (s === "cancelled") {
        c.cancelled++;
      }
    });

    return c;
  }, [allOrders]);

  const handleCloneOrder = (id: string) => {
    window.location.href = `/user/dashboard/clone-order/${id}`;
  };

  const handleShipOrder = (id: string) => {
    router.push(`/user/dashboard/ship-order/${id}`);
  };

  const handleDeleteOrder = async (id: string) => {
    const orderToDelete = allOrders.find((o) => o.id === id);
    if (orderToDelete && orderToDelete.status.toLowerCase() !== "unshipped") {
      return toast.error("Only unshipped orders can be deleted.");
    }

    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await axios.delete(`/api/user/orders/single-order/${id}`);
      setAllOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Order deleted");

      if (drawerOrder?.id === id) {
        setIsDrawerOpen(false);
        setDrawerOrder(null);
      }
    } catch {
      toast.error("Failed to delete order.");
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!window.confirm("Cancel this order?")) return;

    const tid = toast.loading("Requesting cancellation...");

    try {
      const res = await axios.post("/api/user/orders/cancel", { orderId: id });

      if (res.data.success) {
        toast.update(tid, {
          render: "Cancelled successfully.",
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });

        setAllOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
        );
      } else {
        toast.update(tid, {
          render: `Failed: ${res.data.error}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } catch (e: any) {
      toast.update(tid, {
        render: `Failed: ${e.response?.data?.error || "Unknown error"}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleRefreshStatus = async (order: Order) => {
    if (!order.awbNumber || !order.courierName) {
      return toast.error("No AWB/courier found.");
    }

    setRefreshingId(order.id);

    try {
      const res = await axios.post("/api/user/orders/tracking", {
        awbNumber: order.awbNumber,
        courierName: order.courierName,
      });

      if (res.data.normalizedStatus) {
        setAllOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: res.data.normalizedStatus } : o
          )
        );
        toast.success(`Status: ${res.data.normalizedStatus}`);
      }
    } catch {
      toast.error("Failed to refresh.");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDownloadLabel = async (order: Order) => {
    if (!order.awbNumber || !order.courierName) {
      return toast.error("No AWB/courier found.");
    }

    setDownloadingLabelId(order.id);

    try {
      const res = await axios.post("/api/user/shipment/generate-label", {
        orderId: Number(order.id),
        awbNumber: order.awbNumber,
        courierName: order.courierName,
      });

      if (res.data.success && res.data.labelUrl) {
        window.open(res.data.labelUrl, "_blank");
      } else {
        toast.error(res.data.error || "Failed to get label.");
      }
    } catch {
      toast.error("Failed to download label.");
    } finally {
      setDownloadingLabelId(null);
    }
  };

  const openDrawer = (order: Order) => {
    setDrawerOrder(order);
    setIsDrawerOpen(true);
  };

  const shippedStatuses = [
    "shipped",
    "manifested",
    "in_transit",
    "out_for_delivery",
    "undelivered",
  ];
  const labelStatuses = [
    "manifested",
    "shipped",
    "in_transit",
    "out_for_delivery",
  ];
  const refreshStatuses = [
    "manifested",
    "in_transit",
    "out_for_delivery",
    "undelivered",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 dark:bg-[#10162A] sm:p-6">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 animate-pulse dark:border-gray-800 dark:bg-gray-900">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <div className="px-4 pb-0 pt-4 sm:px-0 sm:pt-0">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
              Orders
            </h1>

            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Link
                href="/user/dashboard"
                className="flex items-center transition-colors hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Home className="mr-1 h-3 w-3" />
                Dashboard
              </Link>
              <ChevronRight className="mx-0.5 h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Orders
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders, AWB..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 sm:w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <button
              onClick={() =>
                downloadCSV(
                  isSomeSelected ? effectiveSelectedOrders : filteredOrders
                )
              }
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0a0c37] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              {isSomeSelected
                ? `Download (${effectiveSelectedCount})`
                : "Download"}
            </button>

            <Link
              href="/user/dashboard/single-order"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </div>
        </div>

        <div className="flex -mb-px gap-1 overflow-x-auto pb-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative cursor-pointer whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "border border-b-0 border-gray-200 bg-white text-indigo-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-indigo-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-0 sm:pb-0">
        <div className="border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="block lg:hidden">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-3 p-4">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => openDrawer(order)}
                  >
                    {/* Header: ID, Date and Status */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="break-all text-[13px] font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                            {order.orderId}
                          </div>
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <SBadge status={order.status} />
                    </div>

                    {/* Params Grid: Customer & Payment */}
                    <div className="mb-4 grid grid-cols-2 gap-4 border-b border-gray-50 pb-4 dark:border-gray-700/50">
                      <div>
                        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                          Customer
                        </div>
                        <div className="text-[12px] font-bold text-gray-800 dark:text-gray-100">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] font-medium text-gray-500">
                          {order.mobile}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                          Payment & Value
                        </div>
                        <div className="text-[12px] font-bold text-gray-800 dark:text-gray-100">
                          {order.paymentMode}
                        </div>
                        <div className="text-[12px] font-black text-indigo-600 dark:text-indigo-400">
                          ₹{order.items?.reduce((sum, i) => sum + i.orderValue, 0).toLocaleString() || "0"}
                        </div>
                      </div>
                    </div>

                    {/* Params Grid: Pickup & Address */}
                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                          Pickup Location
                        </div>
                        <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          {order.warehouse?.warehouseName || "N/A"}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                          Shipping Address
                        </div>
                        <div className="line-clamp-1 text-[11px] font-medium text-gray-600 dark:text-gray-400" title={order.address}>
                          {order.address}
                        </div>
                      </div>
                    </div>

                    {/* New Parameter: Courier & AWB (Visible if assigned) */}
                    {(order.courierName || order.awbNumber) && (
                      <div className="mb-4 rounded-lg bg-indigo-50/50 p-2.5 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-100/50 dark:ring-indigo-800/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Courier</div>
                            <div className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">{order.courierName || "Assigning..."}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400">AWB Number</div>
                            <div className="text-[10px] font-mono font-black text-indigo-700 dark:text-indigo-300">{order.awbNumber || "Pending"}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Products Section */}
                    <div className="mb-4">
                      <div className="mb-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                        Ordered Products
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 dark:border-gray-700/50 dark:bg-gray-900/30">
                        {order.items.length > 0 ? (
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className={`flex items-center justify-between text-[11px] ${idx > 0 ? "border-t border-gray-100 pt-1.5 dark:border-gray-800" : ""}`}>
                                <span className="font-bold text-gray-700 dark:text-gray-200 line-clamp-1 flex-1 mr-2">{item.productName}</span>
                                <span className="font-black text-gray-400">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-gray-400">No products listed</span>
                        )}
                      </div>
                    </div>

                    {order.status === "cancelled" && <RefundBadge order={order} />}

                    {/* Actions: Re-aligned and consistent */}
                    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCloneOrder(order.id); }}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-50 px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                      >
                        <Copy className="h-3.5 w-3.5" /> Clone
                      </button>

                      {order.status === "unshipped" && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShipOrder(order.id); }}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
                          >
                            <Truck className="h-3.5 w-3.5" /> Ship Now
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {shippedStatuses.includes(order.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-orange-50 px-4 text-xs font-bold text-orange-700 transition hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      )}

                      {labelStatuses.includes(order.status) && order.awbNumber && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadLabel(order); }}
                          disabled={downloadingLabelId === order.id}
                          className="flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-700 disabled:opacity-50"
                        >
                          <Download className={`h-3.5 w-3.5 ${downloadingLabelId === order.id ? "animate-spin" : ""}`} />
                          Label
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="py-16 text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mb-1 text-base font-semibold text-gray-500 dark:text-gray-400">
                      No orders found
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Try creating a new order or adjusting your search.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden border-t border-gray-200 dark:border-gray-800 lg:block relative">
            <div className="custom-scrollbar w-full max-h-[calc(100vh-250px)] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 whitespace-nowrap text-left">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="text-white">
                    <th className="w-10 border-b border-gray-800 bg-[#0a0c37] px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-gray-400 text-[#0a0c37] accent-white focus:ring-[#0a0c37]"
                      />
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Date
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Order ID
                    </th>
                    <th className="min-w-[200px] border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Products
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Payment
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Customer
                    </th>
                    <th className="max-w-[150px] border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Address
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Pickup
                    </th>
                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Status
                    </th>

                    {activeTab === "cancelled" && (
                      <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                        Refund
                      </th>
                    )}

                    <th className="border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Courier &amp; AWB
                    </th>
                    <th className="shrink-0 border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                      Label
                    </th>
                    <th className="sticky right-0 z-30 border-b border-gray-800 bg-[#0a0c37] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.3)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-[#111827]">
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => openDrawer(order)}
                      className={`group relative cursor-pointer align-top transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 ${
                        selectedIds.has(order.id)
                          ? "bg-indigo-50 dark:bg-indigo-900/30"
                          : ""
                      }`}
                    >
                      <td
                        className="border-b border-gray-200 px-3 py-4 text-center dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-[#0a0c37] focus:ring-[#0a0c37]"
                        />
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-400">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[12px] font-black shadow-sm ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800">
                          {order.orderId}
                        </span>
                      </td>

                      <td className="min-w-[200px] whitespace-normal border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className={`text-xs text-gray-800 dark:text-gray-200 ${
                                  idx > 0
                                    ? "border-t border-gray-100 pt-1 dark:border-gray-800"
                                    : ""
                                }`}
                              >
                                <span className="font-semibold">{item.productName}</span>{" "}
                                <span className="text-gray-500">x{item.quantity}</span>
                                {item.hsn && (
                                  <div className="mt-0.5 text-[10px] text-gray-400">
                                    HSN: {item.hsn}
                                  </div>
                                )}
                              </div>
                            ))}

                            <div className="mt-1.5 border-t border-dashed border-gray-200 pt-1 text-[10px] text-gray-500 dark:border-gray-700">
                              {order.length && order.breadth && order.height
                                ? `Dims: ${order.length}x${order.breadth}x${order.height}cm `
                                : ""}
                              {order.length &&
                              order.breadth &&
                              order.height &&
                              order.physicalWeight
                                ? "| "
                                : ""}
                              {order.physicalWeight ? `Wt: ${order.physicalWeight}Kg` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {order.paymentMode}
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            ₹
                            {order.items.reduce(
                              (sum, item) => sum + item.orderValue,
                              0
                            )}
                          </div>
                        )}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {order.customerName}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {order.mobile}
                        </div>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 min-w-[150px]">
                          
                          <div className="max-w-[120px] truncate text-xs font-medium text-gray-600 dark:text-gray-400">
                            {order.address}
                          </div>

                          <div className="group/address relative">
                            <div className="cursor-help p-1 text-indigo-500 transition-colors hover:text-indigo-700">
                              <Info className="h-3.5 w-3.5" />
                            </div>

                            <div className="invisible absolute top-full left-0 z-[150] mt-1 w-80 -translate-x-4 scale-95 opacity-0 transition-all duration-200 group-hover/address:visible group-hover/address:scale-100 group-hover/address:opacity-100">
                              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="rounded-md bg-indigo-50 p-1.5 dark:bg-indigo-900/30">
                                      <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                      Full Shipping Address
                                    </div>
                                  </div>

                                  <p className="whitespace-normal break-words text-[13px] font-bold leading-relaxed text-gray-700 dark:text-gray-200">
                                    {order.address}
                                  </p>

                                  <div className="flex gap-6 border-t border-gray-50 pt-3 dark:border-gray-700/50">
                                    <div>
                                      <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400">City</div>
                                      <div className="text-[11px] font-black text-gray-800 dark:text-gray-100">{order.city || "N/A"}</div>
                                    </div>
                                    <div>
                                      <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Pincode</div>
                                      <div className="text-[11px] font-black text-gray-800 dark:text-gray-100">{order.pincode || "N/A"}</div>
                                    </div>
                                    <div>
                                      <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400">State</div>
                                      <div className="text-[11px] font-black text-gray-800 dark:text-gray-100">{order.state || "N/A"}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute bottom-full left-6 -mb-1.5 h-3 w-3 rotate-45 border-l border-t border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {order.warehouse?.warehouseName || "-"}
                        </div>
                        {order.warehouse?.warehouseCode && (
                          <div className="mt-0.5 text-[10px] text-gray-500">
                            ({order.warehouse.warehouseCode})
                          </div>
                        )}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 text-center dark:border-gray-800">
                        <SBadge status={order.status} />
                      </td>

                      {activeTab === "cancelled" && (
                        <td className="border-b border-gray-200 px-4 py-4 text-center dark:border-gray-800">
                          <RefundBadge order={order} />
                        </td>
                      )}

                      <td className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                        <div className="inline-block font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/50 mb-1">
                          {order.awbNumber || "PENDING"}
                        </div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-0.5">
                          {order.courierName || "ASSIGNING..."}
                        </div>

                        {refreshStatuses.includes(order.status) && order.awbNumber && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefreshStatus(order);
                            }}
                            disabled={refreshingId === order.id}
                            className="mt-1.5 flex cursor-pointer items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${
                                refreshingId === order.id ? "animate-spin" : ""
                              }`}
                            />
                            Refresh
                          </button>
                        )}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 text-center dark:border-gray-800">
                        {labelStatuses.includes(order.status) && order.awbNumber && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadLabel(order);
                            }}
                            disabled={downloadingLabelId === order.id}
                            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900 group-hover:shadow-sm"
                            title="Download Label"
                          >
                            <Download
                              className={`h-4 w-4 ${
                                downloadingLabelId === order.id ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                        )}
                      </td>

                      <td className="sticky right-0 z-10 border-b border-gray-200 bg-white px-4 py-4 text-center shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)] transition-colors group-hover:bg-indigo-50 dark:border-gray-800 dark:bg-[#111827] dark:group-hover:bg-indigo-900/20">
                        <div
                          className="mx-auto inline-flex justify-center -space-x-px rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCloneOrder(order.id)}
                            className="relative inline-flex items-center rounded-l-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 focus:z-10 dark:border-gray-700 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-800 cursor-pointer"
                            title="Clone"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          {/* Desktop Actions Logic */}
                          {order.status === "unshipped" ? (
                            <>
                              <button
                                onClick={() => handleShipOrder(order.id)}
                                className="relative inline-flex items-center border border-gray-300 px-3 py-2 text-sm font-semibold text-green-700 ring-1 ring-inset ring-gray-300 transition hover:bg-green-50 focus:z-10 dark:border-gray-700 dark:text-green-400 dark:ring-gray-700 dark:hover:bg-green-900/20 cursor-pointer"
                                title="Ship"
                              >
                                <Truck className="h-4 w-4" />
                              </button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="relative inline-flex items-center rounded-r-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 focus:z-10 dark:border-gray-700 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-800 cursor-pointer">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-[80] w-48 p-1">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : shippedStatuses.includes(order.status) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="relative inline-flex items-center rounded-r-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 focus:z-10 dark:border-gray-700 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-800 cursor-pointer">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-[80] w-48 p-1">
                                <DropdownMenuItem
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="cursor-pointer rounded-lg text-orange-600 focus:bg-orange-50 focus:text-orange-700 dark:text-orange-400 dark:focus:bg-orange-900/20"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div
                              className="relative inline-flex cursor-not-allowed items-center rounded-r-xl bg-gray-50/50 px-3 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 dark:bg-gray-800/20 dark:text-gray-600 dark:ring-gray-700"
                              title="No further actions available for this status"
                            >
                              <MoreHorizontal className="h-4 w-4 opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={13}
                        className="border-b border-gray-200 py-16 text-center dark:border-gray-800"
                      >
                        <Package className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <h3 className="mb-1 text-base font-semibold text-gray-500 dark:text-gray-400">
                          No orders found
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Try creating a new order or adjusting your search.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-x border-b border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50 sm:flex-row sm:px-6">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            –{" "}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {filteredOrders.length}
            </span>{" "}
            orders
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Rows:</span>
            <select
              value={itemsPerPage === filteredOrders.length ? "all" : itemsPerPage}
              onChange={(e) => {
                const val =
                  e.target.value === "all"
                    ? filteredOrders.length
                    : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
                setSelectedIds(new Set());
                setSelectAllAcrossPages(false);
              }}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Previous
            </button>

            <span className="min-w-[60px] rounded-lg bg-indigo-600 px-3 py-1.5 text-center text-xs font-bold text-white">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>

        {isSomeSelected && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl bg-[#0a0c37] px-5 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">
                  {effectiveSelectedCount} selected
                </span>
              </div>

              <div className="h-5 w-px bg-white/20" />

              <button
                onClick={() => downloadCSV(effectiveSelectedOrders)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" />
                Download Selected
              </button>

              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectAllAcrossPages(false);
                }}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailDrawer
        order={drawerOrder}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerOrder(null);
        }}
        onClone={handleCloneOrder}
        onDelete={handleDeleteOrder}
        onShip={handleShipOrder}
        onCancel={handleCancelOrder}
        onRefreshStatus={handleRefreshStatus}
        onDownloadLabel={handleDownloadLabel}
        refreshingId={refreshingId}
        downloadingLabelId={downloadingLabelId}
      />
    </div>
  );
};

export default UnifiedOrdersPage;