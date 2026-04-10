"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Package,
  Truck,
  User,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  Printer,
  XCircle,
  RefreshCcw,
  ArrowLeft,
  Navigation,
  ShoppingBag,
  Clock,
  Copy,
  MoreHorizontal,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/user/orders/single-order/${id}`);
      const data = await res.json();

      if (data.order) setOrder(data.order);
    } catch (error) {
      console.error("Failed to fetch order", error);
      toast.error("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!order?.awbNumber || !order?.courierName) {
      return toast.error("No AWB found for this order.");
    }

    setDownloadingLabel(true);

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
      setDownloadingLabel(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!order?.awbNumber || !order?.courierName) {
      return toast.error("AWB not generated yet.");
    }

    setRefreshing(true);

    try {
      const res = await axios.post("/api/user/orders/tracking", {
        awbNumber: order.awbNumber,
        courierName: order.courierName,
      });

      if (res.data.normalizedStatus) {
        setOrder((prev: any) => ({
          ...prev,
          status: res.data.normalizedStatus,
        }));
        toast.success(`Status updated: ${res.data.normalizedStatus}`);
      }
    } catch {
      toast.error("Failed to refresh status.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const tid = toast.loading("Processing cancellation...");

    try {
      const res = await axios.post("/api/user/orders/cancel", {
        orderId: order.id,
      });

      if (res.data.success) {
        toast.update(tid, {
          render: "Order cancelled.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setOrder((prev: any) => ({ ...prev, status: "cancelled" }));
      } else {
        toast.update(tid, {
          render: res.data.error,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (e: any) {
      toast.update(tid, {
        render: "Cancellation failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center font-bold text-gray-500">
        Order not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6 border-b border-gray-100 pb-8 dark:border-gray-800 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="group flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-400 transition-colors hover:text-indigo-600"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-indigo-50 dark:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back
          </button>

          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0a0c37] dark:text-white">
                {order.awbNumber || order.orderId}
              </h1>

              <span
                className={`inline-flex items-center rounded-full border px-4 py-1 text-[11px] font-black uppercase tracking-widest ${
                  order.status === "delivered"
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                    : "border-blue-200 bg-blue-100 text-blue-700"
                }`}
              >
                {order.status.replace("_", " ")}
              </span>
            </div>

            <p className="font-outfit text-sm font-bold text-gray-400">
              Order ID:{" "}
              <span className="text-gray-600 dark:text-gray-300">
                #{order.orderId}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadLabel}
            disabled={downloadingLabel || !order.awbNumber}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {downloadingLabel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print Label
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#0a0c37] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-900/10 transition-all hover:bg-[#1a1c57] active:scale-95">
                Quick Actions <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-xs font-bold uppercase tracking-tight"
                onClick={handleRefreshStatus}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh Status
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-xs font-bold uppercase tracking-tight"
                onClick={() => router.push(`/user/dashboard/clone-order/${order.id}`)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Clone Order
              </DropdownMenuItem>

              <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />

              <DropdownMenuItem
                className="cursor-pointer rounded-lg py-2.5 text-xs font-bold uppercase tracking-tight text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20"
                onClick={handleCancelOrder}
                disabled={order.status === "cancelled"}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Detail Body... [Left Content] */}
        <div className="space-y-8 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 capitalize md:grid-cols-4">
            {[
              { label: "Payment", value: order.paymentMode, icon: CreditCard },
              {
                label: "Weight",
                value: `${order.physicalWeight} KG`,
                icon: Package,
              },
              {
                label: "Date",
                value: new Date(order.createdAt).toLocaleDateString(),
                icon: Calendar,
              },
              {
                label: "Total Value",
                value: `₹${order.shippingCost || 0}`,
                icon: ShoppingBag,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <item.icon className="mb-2 h-4 w-4 text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                  {item.label}
                </p>
                <p className="text-sm font-black text-gray-700 dark:text-gray-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Navigation className="h-20 w-20 text-emerald-600" />
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest leading-none text-gray-400">
                  Consignee
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xl font-black leading-tight text-gray-900 dark:text-white">
                  {order.customerName}
                </p>
                <p className="line-clamp-2 text-sm font-bold leading-relaxed text-gray-500">
                  {order.address}, {order.city}, {order.state} - {order.pincode}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    📞 {order.mobile}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-7 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="absolute top-0 right-0 p-4 text-indigo-600 opacity-5">
                <MapPin className="h-20 w-20" />
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest leading-none text-gray-400">
                  Pickup From
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xl font-black leading-tight text-gray-900 dark:text-white">
                  {order.pickupLocation || "Primary Hub"}
                </p>
                <p className="line-clamp-2 text-sm font-bold leading-relaxed text-gray-500">
                  {order.warehouse?.address1}, {order.warehouse?.city},{" "}
                  {order.warehouse?.state} - {order.warehouse?.pincode}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="bg-gray-50/50 p-6 dark:bg-gray-800/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                Item Inventory
              </h3>
            </div>

            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {order.items?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800"
                  >
                    <td className="px-8 py-5">
                      <p className="uppercase tracking-tighter font-bold text-gray-800 dark:text-gray-200">
                        {item.productName}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">
                        {item.category}
                      </p>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          Qty
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          x{item.quantity}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          Unit Price
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                          ₹{item.orderValue}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Status Timeline) */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0a0c37] dark:text-white">
                  Shipment Log
                </h3>
              </div>

              <button
                onClick={handleRefreshStatus}
                className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCcw
                  className={`h-4 w-4 text-gray-300 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            <div className="relative space-y-8">
              <div className="absolute top-2 bottom-2 left-4 w-0.5 bg-gray-100 dark:bg-gray-700/50" />

              {order.trackingHistory && order.trackingHistory.length > 0 ? (
                order.trackingHistory.map((log: any, idx: number) => {
                  const isLatest = idx === 0;
                  const s = log.normalizedStatus.toLowerCase();

                  const Icon = s.includes("delivered")
                    ? ShoppingBag
                    : s.includes("transit")
                      ? Navigation
                      : s.includes("out_for_delivery")
                        ? Truck
                        : s.includes("manifest") || s.includes("pickup")
                          ? Package
                          : Clock;

                  return (
                    <div
                      key={log.id}
                      className={`relative flex gap-6 ${!isLatest ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-4 ${
                          s.includes("delivered")
                            ? "bg-emerald-500 ring-emerald-50 dark:ring-emerald-900/20"
                            : s.includes("transit") || s.includes("shipped")
                              ? "bg-blue-500 ring-blue-50 dark:ring-blue-900/20"
                              : "bg-indigo-500 ring-indigo-50 dark:ring-indigo-900/20"
                        }`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">
                          {log.normalizedStatus.replace("_", " ")}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {log.description || "Shipment milestone reached."}
                        </p>
                        <p className="mt-2 text-[10px] font-bold text-indigo-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="relative flex gap-6">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 shadow-sm ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                      <Truck className="h-4 w-4 text-white" />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">
                        Pickup Generated
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        System successfully manifested this order for pickup.
                      </p>
                      <p className="mt-2 text-[10px] font-black text-indigo-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-6 opacity-30">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gray-200 ring-4 ring-white dark:bg-gray-700 dark:ring-gray-800">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-gray-300 dark:text-gray-600">
                        In Transit
                      </p>
                      <p className="mt-1 text-xs italic text-gray-400">
                        Waiting for scan...
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Support desk hidden per request */}
        </div>
      </div>
    </div>
  );
}