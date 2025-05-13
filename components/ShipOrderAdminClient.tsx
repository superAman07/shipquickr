"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle, Truck, Package, MapPin, User, DollarSign, CheckCircle, XCircle, Info, ChevronRight, Home, FileText } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  productName: string;
  quantity: number;
  orderValue: number;
}

interface OrderDetails {
  id: number; // DB ID
  orderId: string; // Display Order ID
  userId: string; // ID of the user who owns this order
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  paymentMode: "COD" | "Prepaid";
  codAmount?: number;
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
  items: OrderItem[];
  pickupLocation: string; // Warehouse name
  warehouse: { // Assuming warehouse details are included or fetched separately
    pincode: string;
    // other warehouse details if needed
  };
  status: string;
  // Add other fields you need to display or use
}

interface CourierRate {
  courierName: string;
  serviceType?: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
  // Add any other relevant fields from your rate API response
}

interface ShipOrderAdminClientProps {
  orderIdToShip: string; // The database ID of the order
}

export default function ShipOrderAdminClient({ orderIdToShip }: ShipOrderAdminClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<CourierRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierRate | null>(null);
  const [isShipping, setIsShipping] = useState(false);

  useEffect(() => {
    if (!orderIdToShip) {
      setError("Order ID is missing.");
      setLoadingOrder(false);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoadingOrder(true);
      setError(null);
      try {
        // API call to fetch order details for admin
        const response = await axios.get(`/api/admin/orders/${orderIdToShip}`);
        if (response.data && response.data.order) {
          setOrder(response.data.order);
          // console.log("Fetched Admin Order:", response.data.order);
        } else {
          setError("Order not found or invalid response.");
          toast.error("Order not found.");
        }
      } catch (err: any) {
        console.error("Error fetching order for admin:", err);
        setError(err.response?.data?.error || "Failed to load order details.");
        toast.error(err.response?.data?.error || "Failed to load order details.");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [orderIdToShip]);

  useEffect(() => {
    if (order && order.warehouse?.pincode && order.pincode) {
      const fetchRates = async () => {
        setRatesLoading(true);
        setAvailableCouriers([]);
        try {
          const payload = {
            pickupPincode: order.warehouse.pincode,
            destinationPincode: order.pincode,
            weight: order.physicalWeight,
            length: order.length,
            breadth: order.breadth,
            height: order.height,
            paymentMode: order.paymentMode,
            collectableValue: order.paymentMode === "COD" ? order.codAmount || 0 : 0,
            declaredValue: order.items.reduce((sum, item) => sum + item.orderValue * item.quantity, 0) || 50,
            // Potentially add order.userId if your admin rate calculator needs it for specific user rates
          };
          // API call to fetch courier rates for admin
          // This might be /api/admin/rate-calculator or /api/admin/courier-services
          const response = await axios.post("/api/admin/rate-calculator", payload);
          if (response.data && Array.isArray(response.data.rates)) {
            setAvailableCouriers(response.data.rates);
            if (response.data.rates.length === 0) {
              toast.info("No courier services available for this route/weight.");
            }
          } else {
            setAvailableCouriers([]);
            toast.warn("No rates found or invalid format from API.");
          }
        } catch (rateError: any) {
          console.error("Error fetching admin courier rates:", rateError);
          toast.error(rateError.response?.data?.error || "Failed to fetch courier rates.");
          setAvailableCouriers([]);
        } finally {
          setRatesLoading(false);
        }
      };
      fetchRates();
    }
  }, [order]);


  const handleConfirmShipment = async () => {
    if (!selectedCourier || !order) {
      toast.error("Please select a courier service and ensure order details are loaded.");
      return;
    }
    setIsShipping(true);
    const toastId = toast.loading("Processing shipment...");
    try {
      const payload = {
        orderId: order.id, // DB ID of the order
        userId: order.userId, // User ID of the order owner
        selectedCourier: {
          name: selectedCourier.courierName,
          rate: selectedCourier.courierCharges, // or totalPrice, adjust as needed by backend
          codCharges: selectedCourier.codCharges,
          totalPrice: selectedCourier.totalPrice,
          serviceType: selectedCourier.serviceType,
        },
      };
      // API call to confirm shipment for admin
      const response = await axios.post("/api/admin/shipment/confirm", payload);
      toast.update(toastId, {
        render: response.data.message || "Shipment confirmed successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      router.push(`/admin/dashboard/all-orders?status=shipped`); // Or refresh current page
    } catch (err: any) {
      console.error("Error confirming shipment for admin:", err);
      toast.update(toastId, {
        render: err.response?.data?.error || "Failed to confirm shipment.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsShipping(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading Order Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg text-red-600">{error}</p>
        <Link href="/admin/dashboard/all-orders">
          <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Back to All Orders
          </button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
        <Info className="h-12 w-12 text-gray-500" />
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Order details could not be loaded.</p>
         <Link href="/admin/dashboard/all-orders">
          <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Back to All Orders
          </button>
        </Link>
      </div>
    );
  }
  
  if (order.status !== "unshipped" && order.status !== "pending_pickup") { // Adjust statuses as needed
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center">
         <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-md">
            <Info className="h-10 w-10 mx-auto mb-4 text-yellow-500 dark:text-yellow-400" />
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Order Status Alert</h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-1">
                This order (ID: <strong>{order.orderId}</strong>) cannot be shipped.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
                Current Status: <span className="font-medium capitalize">{order.status.replace("_", " ")}</span>.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3">
                Only 'Unshipped' or 'Pending Pickup' orders can typically be processed for shipment.
            </p>
            <Link href="/admin/dashboard/all-orders">
                <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm">
                    Back to All Orders
                </button>
            </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6">
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center justify-start gap-2 dark:text-amber-50">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  Ship Order (Admin) - {order.orderId}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300 transition-colors min-w-0 shrink-0">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> <span className="truncate">Admin Dashboard</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <Link href="/admin/dashboard/all-orders" className="hover:text-gray-300 transition-colors truncate">All Orders</Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium truncate">Ship Order</span>
              </div>
            </div>
             <div className="text-sm text-indigo-200 dark:text-indigo-300">
                Order for User ID: <strong>{order.userId}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order & Package Details Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Order Summary
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong className="text-gray-600 dark:text-gray-400">Order ID:</strong> {order.orderId}</div>
              <div><strong className="text-gray-600 dark:text-gray-400">Payment:</strong> {order.paymentMode}{order.paymentMode === "COD" && ` (₹${order.codAmount?.toFixed(2)})`}</div>
              <div><strong className="text-gray-600 dark:text-gray-400">Status:</strong> <span className="capitalize font-medium">{order.status.replace("_", " ")}</span></div>
              <div><strong className="text-gray-600 dark:text-gray-400">User ID:</strong> {order.userId}</div>
            </div>
          </div>

          {/* Package Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <Package className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Package Details
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong className="text-gray-600 dark:text-gray-400">Weight:</strong> {order.physicalWeight} kg</div>
              <div><strong className="text-gray-600 dark:text-gray-400">Dimensions:</strong> {order.length}x{order.breadth}x{order.height} cm</div>
              <div className="md:col-span-2"><strong className="text-gray-600 dark:text-gray-400">Contents:</strong>
                <ul className="list-disc list-inside ml-1 mt-1">
                    {order.items.map((item, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{item.productName} (Qty: {item.quantity})</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pickup & Destination Card */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Shipment Route
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup From (Warehouse):</h3>
                    <p className="text-gray-600 dark:text-gray-400">{order.pickupLocation}</p>
                    <p className="text-gray-500 dark:text-gray-500">Pincode: {order.warehouse?.pincode || "N/A"}</p>
                </div>
                <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Deliver To (Customer):</h3>
                    <p className="text-gray-600 dark:text-gray-400">{order.customerName}</p>
                    <p className="text-gray-600 dark:text-gray-400">{order.address}, {order.city}, {order.state} - {order.pincode}</p>
                    <p className="text-gray-500 dark:text-gray-500">Mobile: {order.mobile}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Courier Selection Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <Truck className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Select Courier Service
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {ratesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="ml-3 text-gray-600 dark:text-gray-400">Fetching available couriers...</p>
                </div>
              ) : availableCouriers.length > 0 ? (
                <div className="space-y-3">
                  {availableCouriers.map((rate, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCourier(rate)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg
                        ${selectedCourier?.courierName === rate.courierName && selectedCourier?.serviceType === rate.serviceType // More specific selection if serviceType exists
                          ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 dark:bg-indigo-900/50 dark:border-indigo-600"
                          : "bg-gray-50 border-gray-300 hover:border-indigo-400 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:border-indigo-500"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{rate.courierName} {rate.serviceType && `(${rate.serviceType})`}</h3>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{rate.totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Base: ₹{rate.courierCharges.toFixed(2)}</span>
                        {rate.codCharges > 0 && <span className="ml-2">COD: ₹{rate.codCharges.toFixed(2)}</span>}
                        <span className="ml-2">Wt: {rate.weight.toFixed(2)}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                    <Truck className="h-10 w-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-500 dark:text-gray-400">No courier services available for this route/weight, or rates are still loading.</p>
                </div>
              )}
            </div>
          </div>

          {selectedCourier && (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-300 dark:border-green-700 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                    Selected: <strong className="font-semibold">{selectedCourier.courierName} {selectedCourier.serviceType && `(${selectedCourier.serviceType})`}</strong> for ₹{selectedCourier.totalPrice.toFixed(2)}
                </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleConfirmShipment}
              disabled={!selectedCourier || isShipping || ratesLoading}
              className={`w-full px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center shadow-lg
                ${!selectedCourier || isShipping || ratesLoading
                  ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                  : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                }`}
            >
              {isShipping ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isShipping ? "Processing..." : "Confirm & Ship Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}