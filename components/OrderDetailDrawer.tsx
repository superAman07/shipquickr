"use client";

import React from "react";
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Copy,
  Trash2,
  XCircle,
  RefreshCw,
  Download,
  Calendar,
  Phone,
  Mail,
  Hash,
  Box,
  Weight,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface DrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onShip: (id: string) => void;
  onCancel: (id: string) => void;
  onRefreshStatus: (order: Order) => void;
  onDownloadLabel: (order: Order) => void;
  refreshingId: string | null;
  downloadingLabelId: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </div>

        <div className="break-words text-sm font-medium text-gray-800 dark:text-gray-200">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

interface TrackingEvent {
  status: string;
  description?: string;
  timestamp?: string;
  location?: string;
}

export default function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onClone,
  onDelete,
  onShip,
  onCancel,
  onRefreshStatus,
  onDownloadLabel,
  refreshingId,
  downloadingLabelId,
}: DrawerProps) {
  const [activeTab, setActiveTab] = React.useState<"details" | "tracking">(
    "details"
  );
  const [trackingHistory, setTrackingHistory] = React.useState<TrackingEvent[]>(
    []
  );
  const [isLoadingTracking, setIsLoadingTracking] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && order) {
      setActiveTab("details");
      setTrackingHistory((order as any).trackingHistory || []);
    }
  }, [isOpen, order]);

  const handleTabToggle = async (tab: "details" | "tracking") => {
    setActiveTab(tab);

    if (tab === "tracking" && order?.awbNumber && trackingHistory.length === 0) {
      setIsLoadingTracking(true);

      try {
        const res = await fetch(`/api/user/orders/single-order/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order?.trackingHistory) {
            setTrackingHistory(data.order.trackingHistory);
          }
        }
      } catch {
        // Ignore silently for now
      } finally {
        setIsLoadingTracking(false);
      }
    }
  };

  if (!order) return null;

  const s =
    STATUS_STYLES[order.status.toLowerCase()] || {
      bg: "bg-gray-500/10",
      text: "text-gray-600 dark:text-gray-400",
      dot: "bg-gray-500",
    };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col bg-white shadow-2xl dark:bg-[#111827] sm:w-[480px]"
          >
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white px-6 py-5 dark:border-gray-800 dark:from-[#0a0c37]/50 dark:to-[#111827]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                    Order Details
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.orderId}
                  </h2>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.bg} ${s.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {order.status.replace(/_/g, " ")}
                    </span>

                    {order.refundStatus === "processed" && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✅ ₹{order.refundAmount} refunded
                      </span>
                    )}

                    {order.refundStatus === "pending" && order.refundDueDate && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        🕐 Refund by{" "}
                        {new Date(order.refundDueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="mt-4 flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => handleTabToggle("details")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeTab === "details"
                      ? "border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Order Details
                </button>
                <button
                  onClick={() => handleTabToggle("tracking")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeTab === "tracking"
                      ? "border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Live Tracking
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === "details" ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {order.warehouse && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                              <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>

                            <div className="my-1 h-6 w-0.5 bg-indigo-200 dark:bg-indigo-800" />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                Pickup
                              </div>
                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {order.warehouse.warehouseName}
                              </div>
                            </div>

                            {order.awbNumber && (
                              <div className="-my-1 flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500">
                                  {order.courierName} · AWB: {order.awbNumber}
                                </span>
                              </div>
                            )}

                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                                Delivery
                              </div>
                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {order.address}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <InfoRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Order Date"
                      value={new Date(order.orderDate).toLocaleDateString()}
                    />
                    <InfoRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Mobile"
                      value={order.mobile}
                    />
                    <InfoRow
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={order.email}
                    />
                    <InfoRow
                      icon={<Hash className="h-4 w-4" />}
                      label="Order ID"
                      value={order.orderId}
                    />
                    <InfoRow
                      icon={<Package className="h-4 w-4" />}
                      label="Pickup Location"
                      value={order.pickupLocation}
                    />
                    <InfoRow
                      icon={<CreditCard className="h-4 w-4" />}
                      label="Payment Mode"
                      value={order.paymentMode}
                    />
                    <InfoRow
                      icon={<Box className="h-4 w-4" />}
                      label="Address"
                      value={order.address}
                    />
                    <InfoRow
                      icon={<Weight className="h-4 w-4" />}
                      label="Weight"
                      value={
                        order.physicalWeight
                          ? `${order.physicalWeight} KG`
                          : undefined
                      }
                    />

                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                        Items
                      </div>

                      <div className="space-y-3">
                        {order.items?.length ? (
                          order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50"
                            >
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {item.productName}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Qty: {item.quantity} · Value: ₹{item.orderValue}
                                {item.hsn ? ` · HSN: ${item.hsn}` : ""}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 dark:border-gray-800">
                            No items
                          </div>
                        )}
                      </div>
                    </div>

                    {refreshStatuses.includes(order.status.toLowerCase()) &&
                      order.awbNumber && (
                        <button
                          onClick={() => onRefreshStatus(order)}
                          disabled={refreshingId === order.id}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              refreshingId === order.id ? "animate-spin" : ""
                            }`}
                          />
                          Refresh Status
                        </button>
                      )}

                    {labelStatuses.includes(order.status.toLowerCase()) &&
                      order.awbNumber && (
                        <button
                          onClick={() => onDownloadLabel(order)}
                          disabled={downloadingLabelId === order.id}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
                        >
                          <Download
                            className={`h-4 w-4 ${
                              downloadingLabelId === order.id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          Download Label
                        </button>
                      )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="tracking"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-xl shadow-indigo-500/20">
                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white opacity-10" />
                      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white opacity-10" />

                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-100 backdrop-blur-sm">
                              {order.courierName || "Local Carrier"}
                            </span>
                          </div>

                          <div className="mb-0.5 text-xs font-medium text-indigo-100/80">
                            Tracking ID
                          </div>
                          <div className="break-all font-mono text-xl font-bold tracking-tight leading-tight text-white">
                            {order.awbNumber || "AWB Generating..."}
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-indigo-300/30">
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="absolute inset-y-0 w-1/2 bg-white/40 blur-[2px]"
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  order.status === "delivered" ? "100%" : "50%",
                              }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute inset-y-0 left-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-left">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-50">
                                Origin
                              </div>
                              <div className="max-w-[100px] truncate text-xs font-semibold text-white">
                                {order.pickupLocation || "Warehouse"}
                              </div>
                            </div>

                            <motion.div
                              animate={{ y: [0, -3, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="rounded-full bg-white p-1.5 shadow-lg"
                            >
                              <Truck className="h-5 w-5 text-indigo-600" />
                            </motion.div>

                            <div className="text-right">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-50">
                                Destination
                              </div>
                              <div className="max-w-[100px] truncate text-xs font-semibold text-white">
                                {order.city || order.pincode}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative rounded-2xl border-2 border-slate-100 bg-white p-2 shadow-sm before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gradient-to-b before:from-indigo-50 before:to-white dark:border-slate-800 dark:bg-slate-900 before:dark:from-indigo-950/20 before:dark:to-slate-900">
                      {isLoadingTracking ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-indigo-500" />
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Fetching live position...
                          </p>
                        </div>
                      ) : trackingHistory.length > 0 ? (
                        <div className="relative ml-6 space-y-8 border-l border-slate-200 py-4 pl-6 dark:border-slate-700">
                          {trackingHistory.map((evt, idx) => (
                            <div key={idx} className="relative">
                              <div
                                className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                  idx === 0
                                    ? "bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
                                    : "bg-slate-300 dark:bg-slate-600"
                                }`}
                              />

                              <div className="flex flex-col gap-2 md:flex-row">
                                <div className="w-24 shrink-0">
                                  {evt.timestamp && (
                                    <>
                                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        {new Date(evt.timestamp).toLocaleDateString(
                                          undefined,
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          }
                                        )}
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-500">
                                        {new Date(evt.timestamp).toLocaleTimeString()}
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div className="group flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                                  <div className="mb-1 text-xs font-bold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                    <span className="mr-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                                      Activity
                                    </span>
                                    {evt.description || evt.status}
                                  </div>

                                  {evt.location && (
                                    <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                      <MapPin className="h-3 w-3" />
                                      {evt.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 ring-8 ring-slate-50 dark:bg-slate-800 dark:ring-slate-800/50">
                            <Box className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                          </div>

                          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                            No Tracking Events Yet
                          </h3>

                          <p className="mb-6 mt-2 max-w-[250px] text-xs font-medium leading-relaxed text-slate-500">
                            {order.awbNumber
                              ? "The courier partner has not generated any transit checkpoints yet. Please check back later."
                              : "This shipment hasn't been processed yet. Ship it to generate an AWB and start tracking."}
                          </p>

                          {order.awbNumber && (
                            <button
                              onClick={() => {
                                setIsLoadingTracking(true);
                                setTimeout(() => setIsLoadingTracking(false), 800);
                              }}
                              className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-800 px-6 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 dark:bg-slate-200 dark:text-slate-900"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Force Refresh
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onClone(order.id)}
                  className="flex min-w-[100px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 hover:shadow-sm dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-800"
                  title="Clone this order"
                >
                  <Copy className="h-4 w-4" />
                  Clone
                </button>

                {order.status.toLowerCase() === "unshipped" && (
                  <>
                    <button
                      onClick={() => onShip(order.id)}
                      className="flex min-w-[100px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 hover:shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-800"
                      title="Ready to Ship"
                    >
                      <Truck className="h-4 w-4" />
                      Ship
                    </button>

                    <button
                      onClick={() => onDelete(order.id)}
                      className="flex min-w-[44px] cursor-pointer items-center justify-center rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:shadow-sm dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-800"
                      title="Delete Order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}

                {order.status.toLowerCase() !== "unshipped" && (
                  <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    <XCircle className="h-3.5 w-3.5" />
                    Status Locked
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}