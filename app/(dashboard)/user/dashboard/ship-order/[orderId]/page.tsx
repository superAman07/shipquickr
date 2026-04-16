"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderItem {
  productName: string;
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
  address: string;
  pincode: string;
  pickupLocation: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
  codAmount?: number | string;
}

interface Warehouse {
  id: string;
  warehouseName: string;
  pincode: string;
}

interface CourierRate {
  name: string;
  logoUrl?: string;
  serviceType: string;
  minWeight: number;
  rate: number;
  codCharges: number;
  totalPrice: number;
  weight: number;
  courierPartnerId?: number;
  expectedDelivery?: string;
}

interface RateResult {
  courierName: string;
  serviceType?: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
  courierPartnerId?: number;
  expectedDelivery?: string;
  image?: string;
}

export default function ShipOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [pickupPincode, setPickupPincode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<CourierRate[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierRate | null>(
    null
  );
  const [isShipping, setIsShipping] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterMode, setFilterMode] = useState<
    "All" | "Recommended" | "Cheapest" | "Fastest"
  >("All");

  const calculateTotalOrderValue = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;

    return items.reduce(
      (sum, item) =>
        sum + Number(item.orderValue || 0) * Number(item.quantity || 0),
      0
    );
  };

  const getCourierLogo = (courierName: string): string | undefined => {
    const nameLower = courierName?.toLowerCase() || "";

    if (nameLower.includes("ecom express")) return "/ecom-express.png";
    if (nameLower.includes("xpressbees")) return "/xpressbees.png";
    if (nameLower.includes("shadowfax")) return "/shadowfax.png";

    return undefined;
  };

  useEffect(() => {
    const fetchOrderAndRates = async () => {
      if (!orderId) return;

      setLoading(true);
      setRatesLoading(true);
      setError(null);
      setAvailableCouriers([]);
      setOrder(null);
      setPickupPincode(null);

      let fetchedOrder: Order | null = null;
      let fetchedPickupPincode: string | null = null;

      try {
        console.log("Fetching order details for:", orderId);

        const orderRes = await axios.get(
          `/api/user/orders/single-order/${orderId}`
        );

        if (orderRes.data.order) {
          fetchedOrder = orderRes.data.order;
          setOrder(fetchedOrder);
          console.log("Order details fetched:", fetchedOrder);
        } else {
          console.error("Order not found in API response.");
          setError("Order not found.");
          return;
        }

        if (fetchedOrder?.pickupLocation) {
          console.log(
            "Fetching warehouse pincode for:",
            fetchedOrder.pickupLocation
          );

          try {
            const warehouseRes = await axios.get(
              `/api/user/warehouses?search=${encodeURIComponent(
                fetchedOrder.pickupLocation
              )}`
            );

            if (
              warehouseRes.data.warehouses &&
              warehouseRes.data.warehouses.length > 0
            ) {
              fetchedPickupPincode = warehouseRes.data.warehouses[0].pincode;
              setPickupPincode(fetchedPickupPincode);
              console.log("Pickup pincode fetched:", fetchedPickupPincode);
            } else {
              console.warn(
                "Could not find warehouse details for pickup location:",
                fetchedOrder.pickupLocation
              );
              setError(
                "Could not determine pickup pincode. Please check the order's pickup location."
              );
            }
          } catch (whError) {
            console.error("Error fetching warehouse details:", whError);
            setError("Failed to fetch pickup location details.");
          }
        } else {
          console.warn("Pickup location not set for this order.");
          setError("Pickup location not set for this order.");
        }

        if (fetchedOrder && fetchedPickupPincode) {
          console.log("Attempting to fetch courier rates...");

          try {
            const ratePayload = {
              pickupPincode: fetchedPickupPincode,
              destinationPincode: fetchedOrder.pincode,
              weight: fetchedOrder.physicalWeight || 0.5,
              length: fetchedOrder.length || 10,
              width: fetchedOrder.breadth || 10,
              height: fetchedOrder.height || 10,
              paymentMode: fetchedOrder.paymentMode,
              collectableValue:
                fetchedOrder.paymentMode === "COD"
                  ? calculateTotalOrderValue(fetchedOrder.items)
                  : 0,
              declaredValue: calculateTotalOrderValue(fetchedOrder.items) || 50,
            };

            console.log("Rate Payload:", ratePayload);

            const ratesRes = await axios.post<{ rates: RateResult[] }>(
              "/api/user/courier-services",
              ratePayload
            );

            console.log("Rate API Response:", ratesRes.data);

            if (ratesRes.data && Array.isArray(ratesRes.data.rates)) {
              if (ratesRes.data.rates.length > 0) {
                const mappedCouriers: CourierRate[] = ratesRes.data.rates
                  .filter(
                    (rate) =>
                      !rate.courierName?.toLowerCase().includes("shadowfax")
                  )
                  .map((rate) => ({
                    name: rate.courierName,
                    logoUrl: rate.image || getCourierLogo(rate.courierName),
                    serviceType: rate.serviceType || "Standard",
                    minWeight: 0.5,
                    rate: rate.courierCharges,
                    codCharges: rate.codCharges,
                    totalPrice: rate.totalPrice,
                    weight: rate.weight,
                    courierPartnerId: rate.courierPartnerId,
                    expectedDelivery: rate.expectedDelivery,
                  }));

                setAvailableCouriers(mappedCouriers);
                console.log("Mapped Couriers:", mappedCouriers);
              } else {
                console.warn("Rate API returned an empty array of rates.");
                setAvailableCouriers([]);
              }
            } else {
              console.warn("No rates array received from API or invalid format.");
              setAvailableCouriers([]);
            }
          } catch (rateError: any) {
            console.error("Error fetching courier rates:", rateError);
            toast.error(
              rateError.response?.data?.error || "Failed to fetch courier rates."
            );
            setAvailableCouriers([]);
          }
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details.");
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
        setRatesLoading(false);
        console.log("Finished fetchOrderAndRates effect.");
      }
    };

    fetchOrderAndRates();
  }, [orderId]);

  const appliedWeight = order?.physicalWeight
    ? Number(order.physicalWeight)
    : 0;

  const handleSelectCourier = (courier: CourierRate) => {
    setSelectedCourier(courier);
  };

  const executeShipment = async () => {
    if (!selectedCourier || !order) {
      toast.warn("Please select a courier partner first.");
      return;
    }

    setIsShipping(true);
    const toastId = toast.loading("Creating shipment...");

    try {
      const response = await axios.post("/api/user/shipment/confirm", {
        orderId: order.id,
        selectedCourier,
      });

      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, {
          render: `Shipment created successfully! AWB: ${response.data.awbNumber}`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });

        setTimeout(() => router.push("/user/dashboard/bulk"), 3000);
      } else {
        throw new Error(response.data.error || "Failed to create shipment");
      }
    } catch (error: any) {
      console.error("Error creating shipment:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An unknown error occurred";

      toast.update(toastId, {
        render: `Failed to create shipment: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 7000,
      });
    } finally {
      setIsShipping(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">
          Loading Order Details...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <Package className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <p>{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!order) {
    return <div className="p-6 text-center text-gray-500">Order data not available.</div>;
  }

  const totalOrderValue = calculateTotalOrderValue(order.items);

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 dark:bg-[#10162A] dark:text-gray-100 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="flex items-center text-2xl font-bold text-gray-800 dark:text-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                title="Go Back"
                className="mr-3 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              Select Courier Partner
            </h1>

            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              <Link
                href="/user/dashboard"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Dashboard
              </Link>
              <ChevronRight className="mx-1 h-3 w-3" />
              <Link
                href="/user/dashboard/bulk"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Orders
              </Link>
              <ChevronRight className="mx-1 h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Ship
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the best courier option for Order ID:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {order.orderId}
            </span>
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 md:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Pickup From
            </label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {pickupPincode || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Deliver To
            </label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {order.pincode}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Order Value(₹)
            </label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {totalOrderValue.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Applied Weight(Kg)
            </label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {availableCouriers.length > 0
                ? availableCouriers[0].weight.toFixed(2)
                : appliedWeight.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-24">
          {!ratesLoading && availableCouriers.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(["All", "Recommended", "Cheapest", "Fastest"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      filterMode === mode
                        ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-800/20 dark:bg-slate-200 dark:text-slate-900 dark:ring-slate-200/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          )}

          <div className="max-h-[50vh] pt-4 px-2 -mx-2 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            {ratesLoading ? (
              <div className="flex min-h-[300px] h-full flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500 opacity-20 blur-xl" />
                  <Loader2 className="relative z-10 h-12 w-12 animate-spin text-indigo-600" />
                </div>
                <p className="animate-pulse text-sm font-bold tracking-wide text-slate-600 dark:text-slate-400">
                  Querying Partner Networks...
                </p>
              </div>
            ) : availableCouriers.length > 0 ? (
              (() => {
                const sortedCouriers = [...availableCouriers].sort(
                  (a, b) => a.totalPrice - b.totalPrice
                );
                const cheapestCourier = sortedCouriers[0];

                const filteredCouriers = sortedCouriers.filter((courier) => {
                  if (filterMode === "All") return true;
                  if (filterMode === "Cheapest") return courier === cheapestCourier;
                  if (filterMode === "Fastest") {
                    return (
                      courier.serviceType?.toLowerCase().includes("express") ||
                      courier.serviceType?.toLowerCase().includes("air")
                    );
                  }
                  if (filterMode === "Recommended") {
                    return courier.name?.toLowerCase().includes("delhivery");
                  }
                  return true;
                });

                if (filteredCouriers.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-12 text-slate-500 dark:border-slate-800 dark:bg-slate-800/20">
                      <Package className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold">
                        No couriers match the "{filterMode}" filter.
                      </p>
                      <button
                        onClick={() => setFilterMode("All")}
                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Clear Filter
                      </button>
                    </div>
                  );
                }

                return filteredCouriers.map((courier, index) => {
                  const isExpress =
                    courier.serviceType?.toLowerCase().includes("express") ||
                    courier.serviceType?.toLowerCase().includes("air");

                  const isSelected =
                    selectedCourier?.name === courier.name &&
                    selectedCourier?.serviceType === courier.serviceType;

                  const isCheapest = courier === cheapestCourier;

                  return (
                    <div
                      key={`${courier.name}-${courier.serviceType}-${index}`}
                      onClick={() => handleSelectCourier(courier)}
                      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 sm:p-5 mb-4 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/80 shadow-md shadow-blue-500/20 ring-1 ring-blue-500 dark:bg-blue-900/40"
                          : "border-slate-200 bg-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
                      }`}
                    >
                      <div className="absolute -right-2 -top-3 z-10 flex flex-wrap justify-end gap-2">
                        {isCheapest && (
                          <div className="rounded-full border border-white bg-gradient-to-r from-emerald-400 to-green-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-green-500/20 dark:border-gray-800">
                            💰 Cheapest
                          </div>
                        )}

                        {isExpress && !isCheapest && (
                          <div className="rounded-full border border-white bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/20 dark:border-gray-800">
                            ⚡ Fastest
                          </div>
                        )}

                        {courier.name?.toLowerCase().includes("delhivery") && (
                          <div className="rounded-full border border-white bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 dark:border-gray-800">
                            ⭐ Recommended
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
                        <div className="col-span-1 flex h-full flex-row items-center justify-between border-b border-slate-200/60 pb-3 sm:col-span-4 sm:justify-start sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 dark:border-gray-700">
                          <div className="flex items-center">
                            <div
                              className={`mr-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors sm:mr-6 ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isSelected && (
                                <div className="h-2.5 w-2.5 rounded-full bg-white" />
                              )}
                            </div>

                            <div className="flex flex-col items-start justify-center">
                              {courier.logoUrl ? (
                                <div className="relative mb-1.5 h-8 w-24 sm:w-28 transition-transform group-hover:scale-105">
                                  <Image
                                    src={courier.logoUrl}
                                    alt={`${courier.name} logo`}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <span className="mb-1.5 block text-sm font-extrabold text-gray-700 dark:text-gray-200">
                                  {courier.name}
                                </span>
                              )}

                              <div className="mb-2 flex items-center gap-2">
                                <span
                                  className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                                    isExpress
                                      ? "border-orange-200 bg-orange-50 text-orange-700"
                                      : "border-blue-200 bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {courier.serviceType || "Standard"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:gap-3">
                                <span className="flex items-center gap-0.5" title="4.5 Rating">
                                  ⭐ 4.5
                                </span>
                                <span className="flex items-center gap-0.5" title="92% Success Rate">
                                  📦 92%
                                </span>
                                <span className="flex items-center gap-0.5" title="Low Return to Origin">
                                  ❌ Low RTO
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 grid grid-cols-3 gap-2 pl-0 sm:col-span-5 sm:gap-4 sm:pl-2">
                          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Weight
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                              {courier.weight.toFixed(2)}{" "}
                              <span className="text-xs text-slate-500">kg</span>
                            </p>
                          </div>

                          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Transit
                            </p>
                            <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {courier.expectedDelivery || "3-5 Days"}
                            </p>
                          </div>

                          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Freight
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                              ₹{courier.rate.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-1 flex items-center justify-between rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-3 transition-colors group-hover:bg-indigo-50 dark:border-indigo-800/30 dark:bg-indigo-900/20 dark:group-hover:bg-indigo-900/40 sm:col-span-3 sm:flex-col sm:justify-center">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 sm:text-center">
                              Total
                            </p>
                            <p className="mt-0.5 text-center text-xl font-black tracking-tight text-indigo-700 dark:text-indigo-400 sm:text-2xl">
                              ₹{courier.totalPrice.toFixed(0)}
                            </p>
                          </div>

                          <div className="flex flex-col text-right sm:hidden">
                            <p className="text-[10px] font-medium text-slate-500">
                              Includes COD
                            </p>
                            <p className="text-[11px] font-bold text-slate-700">
                              ₹{courier.codCharges.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              !ratesLoading && (
                <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-white opacity-60 shadow-sm transition-opacity hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
                  <Truck className="mb-5 h-20 w-20 text-slate-300 dark:text-slate-600" />
                  <p className="max-w-[250px] text-center text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400">
                    No courier services available for this route or weight capacity.
                  </p>
                </div>
              )
            )}
          </div>

          {!ratesLoading && availableCouriers.length > 0 && (
            <>
              <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedCourier || isShipping}
                  className={`pointer-events-auto cursor-pointer flex transform items-center justify-center rounded-full px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                    !selectedCourier || isShipping
                      ? "scale-95 cursor-not-allowed bg-gray-400 opacity-90 dark:bg-gray-600"
                      : "scale-100 ring-4 ring-blue-500/30 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                  }`}
                >
                  {isShipping && !showConfirmDialog ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-3 h-5 w-5" />
                      Ship Now{" "}
                      {selectedCourier
                        ? `(₹${selectedCourier.totalPrice.toFixed(0)})`
                        : ""}
                    </>
                  )}
                </button>
              </div>

              <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl dark:bg-gray-900 overflow-hidden">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                      <Truck className="h-6 w-6 text-indigo-500" />
                      Confirm Shipment
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-4 text-gray-600 dark:text-gray-400">
                      You are about to dispatch this order via{" "}
                      <strong className="rounded bg-gray-100 px-2 py-1 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {selectedCourier?.name}
                      </strong>{" "}
                      for a base freight rate of{" "}
                      <strong className="text-xl text-indigo-600 dark:text-indigo-400">
                        ₹{selectedCourier?.totalPrice.toFixed(2)}
                      </strong>.
                      <br />
                      <br />
                      The final amount, including applicable taxes, will be securely deducted
                      from your wallet balance. Are you ready to process this?
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
                    <AlertDialogCancel 
                      disabled={isShipping}
                      className="cursor-pointer rounded-xl font-bold hover:bg-gray-50 focus:ring-0 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={executeShipment}
                      disabled={isShipping}
                      className="cursor-pointer rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-white shadow-md shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 focus:ring-0 dark:shadow-none"
                    >
                      {isShipping ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                      ) : null }
                      {isShipping ? "Dispatching..." : "Confirm & Ship"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}