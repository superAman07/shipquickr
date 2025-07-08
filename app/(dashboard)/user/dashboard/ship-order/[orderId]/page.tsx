'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, ChevronRight, Home, Loader2, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
}
interface RateResult {
  courierName: string;
  serviceType?: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
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
  const [selectedCourier, setSelectedCourier] = useState<CourierRate | null>(null);
  const [isShipping, setIsShipping] = useState(false);

  const getCourierLogo = (courierName: string): string | undefined => {
    const nameLower = courierName?.toLowerCase() || "";
    if (nameLower.includes("ecom express")) {
      return "/ecom-express.png";
    }
    if (nameLower.includes("xpressbees")) {
      return "/xpressbees.png";
    }
    if (nameLower.includes("shadowfax")) {
      return "/shadowfax.png";
    }
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
        const orderRes = await axios.get(`/api/user/orders/single-order/${orderId}`);
        if (orderRes.data.order) {
          fetchedOrder = orderRes.data.order;
          setOrder(fetchedOrder);
          console.log("Order details fetched:", fetchedOrder);
        } else {
          console.error("Order not found in API response.");
          setError("Order not found.");
          setLoading(false);
          setRatesLoading(false);
          return;
        }
        if (fetchedOrder?.pickupLocation) {
          console.log("Fetching warehouse pincode for:", fetchedOrder.pickupLocation);
          try {
            const warehouseRes = await axios.get(`/api/user/warehouses?search=${encodeURIComponent(fetchedOrder.pickupLocation)}`);
            if (warehouseRes.data.warehouses && warehouseRes.data.warehouses.length > 0) {
              fetchedPickupPincode = warehouseRes.data.warehouses[0].pincode;
              setPickupPincode(fetchedPickupPincode);
              console.log("Pickup pincode fetched:", fetchedPickupPincode);
            } else {
              console.warn("Could not find warehouse details for pickup location:", fetchedOrder.pickupLocation);
              setError("Could not determine pickup pincode. Please check the order's pickup location.");
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
              collectableValue: fetchedOrder.paymentMode === "COD" ? (calculateTotalOrderValue(fetchedOrder.items)) : 0,
              declaredValue: calculateTotalOrderValue(fetchedOrder.items) || 50,
            };
            console.log("Rate Payload:", ratePayload);

            const ratesRes = await axios.post<{ rates: RateResult[] }>('/api/user/courier-services', ratePayload);
            console.log("Rate API Response:", ratesRes.data);

            if (ratesRes.data && Array.isArray(ratesRes.data.rates)) {
              if (ratesRes.data.rates.length > 0) {
                const mappedCouriers: CourierRate[] = ratesRes.data.rates.map(rate => ({
                  name: rate.courierName,
                  logoUrl: getCourierLogo(rate.courierName),
                  serviceType: rate.serviceType || 'Standard',
                  minWeight: 0.5, // dummy
                  rate: rate.courierCharges,
                  codCharges: rate.codCharges,
                  totalPrice: rate.totalPrice,
                  weight: rate.weight,
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
            toast.error(rateError.response?.data?.error || "Failed to fetch courier rates.");
            setAvailableCouriers([]);
          } finally {
            console.log("Skipping rate fetch because order or pickup pincode is missing.");
            setRatesLoading(false);
          }
        }

      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details.");
        toast.error("Failed to load order details.");
        setRatesLoading(false);
      } finally {
        setLoading(false);
        console.log("Finished fetchOrderAndRates effect.");
      }
    };

    fetchOrderAndRates();
  }, [orderId]);

  const calculateTotalOrderValue = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (Number(item.orderValue || 0) * Number(item.quantity || 0)), 0);
  };

  const appliedWeight = order?.physicalWeight ? Number(order.physicalWeight) : 0;

  const handleSelectCourier = (courier: CourierRate) => {
    setSelectedCourier(courier);
  };

  const handleConfirmShipment = async () => {
    if (!selectedCourier || !order) {
      toast.warn("Please select a courier partner first.");
      return;
    }
    setIsShipping(true);
    const toastId = toast.loading("Creating shipment...");
    try {
      const response = await axios.post('/api/user/shipment/confirm', {
        orderId: order.id,
        selectedCourier: selectedCourier
      });

      if (response.status === 200 || response.status === 201) {
        toast.update(toastId, { render: `Shipment created successfully! AWB: ${response.data.awbNumber}`, type: "success", isLoading: false, autoClose: 5000 });
        setTimeout(() => router.push('/user/dashboard/bulk'), 3000);
      } else {
        throw new Error(response.data.error || "Failed to create shipment");
      }

    } catch (error: any) {
      console.error("Error creating shipment:", error);
      const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
      toast.update(toastId, { render: `Failed to create shipment: ${errorMessage}`, type: "error", isLoading: false, autoClose: 7000 });
    } finally {
      setIsShipping(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading Order Details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <Package className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <p>{error}</p>
        <button type='button' onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <button type='button' onClick={() => router.back()} title="Go Back" className="mr-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <ArrowLeft size={20} />
              </button>
              Select Courier Partner
            </h1>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Link href="/user/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <ChevronRight className="h-3 w-3 mx-1" />
              <Link href="/user/dashboard/bulk" className="hover:text-blue-600 dark:hover:text-blue-400">Orders</Link>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Ship</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose the best courier option for Order ID: <span className='font-semibold text-blue-600 dark:text-blue-400'>{order.orderId}</span></p>
        </div>

        {/* Order Details Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Pickup From</label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{pickupPincode || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Deliver To</label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{order.pincode}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Order Value (₹)</label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{totalOrderValue.toFixed(2)}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Applied Weight (Kg)</label>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {availableCouriers.length > 0 ? availableCouriers[0].weight.toFixed(2) : appliedWeight.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {ratesLoading ? (
            <div className="flex justify-center items-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">Fetching Available Couriers...</span>
            </div>
          ) : availableCouriers.length > 0 ? (
            availableCouriers.map((courier, index) => (
              <div
                key={`${courier.name}-${courier.serviceType}-${index}`}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-4 ${selectedCourier?.name === courier.name && selectedCourier?.serviceType === courier.serviceType
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                onClick={() => handleSelectCourier(courier)}
              >
                <input
                  type="radio"
                  name="courierSelection"
                  title={`Select ${courier.name} - ${courier.serviceType}`}
                  checked={selectedCourier?.name === courier.name && selectedCourier?.serviceType === courier.serviceType}
                  onChange={() => handleSelectCourier(courier)}
                  className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 flex-shrink-0" // Added flex-shrink-0
                />
                {courier.logoUrl && (
                  <div className="relative h-10 w-20 flex-shrink-0"> {/* Added flex-shrink-0 */}
                    <Image src={courier.logoUrl} alt={`${courier.name} logo`} layout="fill" objectFit="contain" />
                  </div>
                )}
                {!courier.logoUrl && (
                  <div className="h-10 w-20 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded"> {/* Placeholder */}
                    <Package size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 items-center">
                  <div className="md:col-span-1">
                    <span className="font-semibold text-base md:text-lg block leading-tight">{courier.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 block leading-tight">{courier.serviceType}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 block">Min. Weight: {courier.minWeight} Kg</span>
                  </div>
                  <div className="text-left md:text-center md:col-span-1">
                  </div>
                  <div className="text-left md:text-right md:col-span-1">
                    <span className="font-bold text-lg md:text-xl text-blue-700 dark:text-blue-400 block">₹{courier.totalPrice.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Freight: ₹{courier.rate.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">+ COD Charges: ₹{courier.codCharges.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            !ratesLoading && (
              <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <Truck className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No courier services available for this route/weight.</p>
              </div>
            )
          )}
        </div>

        {!ratesLoading && availableCouriers.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleConfirmShipment}
              disabled={!selectedCourier || isShipping}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center shadow-md ${!selectedCourier || isShipping
                  ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                }`}
            >
              {isShipping ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Shipping...
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5 mr-2" />
                  Ship Now
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}