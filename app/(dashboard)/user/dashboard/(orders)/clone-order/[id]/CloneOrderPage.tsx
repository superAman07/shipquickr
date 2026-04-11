"use client";

import { useEffect, useState } from "react";
import type React from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";
import KycGuard from "@/components/isKycDone";
import {
  Plus,
  Trash2,
  Loader2,
  Home,
  ChevronRight,
  RefreshCcw,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface OrderItem {
  productName: string;
  category: string;
  quantity: number | string;
  orderValue: number | string;
  hsn: string;
}

interface FormState {
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  landmark: string;
  pincode: string;
  state: string;
  city: string;
  orderId: string;
  orderDate: string;
  paymentMode: string;
  items: OrderItem[];
  codAmount: number | string;
  physicalWeight: number | string;
  length: number | string;
  breadth: number | string;
  height: number | string;
  pickupLocation: string;
  warehouseId: number | null;
}

const initialItem: OrderItem = {
  productName: "",
  category: "",
  quantity: 1,
  orderValue: "",
  hsn: "",
};

const initialForm: FormState = {
  customerName: "",
  mobile: "",
  email: "",
  address: "",
  landmark: "",
  pincode: "",
  state: "",
  city: "",
  orderId: "",
  orderDate: new Date().toISOString().split("T")[0],
  paymentMode: "",
  items: [initialItem],
  codAmount: "",
  physicalWeight: "",
  length: "",
  breadth: "",
  height: "",
  pickupLocation: "",
  warehouseId: null,
};

export default function CloneOrderPage({ orderId }: { orderId: string }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);

    axios
      .get(`/api/user/orders/single-order/${orderId}`)
      .then((res) => {
        const fetchedOrder = res.data.order;

        if (!fetchedOrder) {
          toast.error("Original order not found.");
          setLoading(false);
          return;
        }

        const {
          id,
          orderId: originalClonedOrderId,
          orderDate: originalOrderDate,
          status,
          items: fetchedItems,
          createdAt,
          updatedAt,
          userId,
          warehouseId: originalWarehouseId,
          pickupLocation: originalPickupLocation,
          ...rest
        } = fetchedOrder;

        const itemsForForm =
          fetchedItems && fetchedItems.length > 0
            ? fetchedItems.map((item: any) => ({
                productName: item.productName || "",
                category: item.category || "",
                quantity: item.quantity || 1,
                orderValue: item.orderValue || "",
                hsn: item.hsn || "",
              }))
            : [initialItem];

        setForm({
          ...initialForm,
          ...rest,
          items: itemsForForm,
          orderId: `SQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          orderDate: new Date().toISOString().slice(0, 10),
          warehouseId: originalWarehouseId || null,
          pickupLocation: originalPickupLocation || "",
          codAmount: rest.paymentMode === "COD" ? rest.codAmount || "" : "",
        });
      })
      .catch((error) => {
        console.error("Error fetching order to clone:", error);
        toast.error("Failed to load order data for cloning.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    itemIndex?: number
  ) => {
    const { name, value } = e.target;

    if (itemIndex !== undefined && name in initialItem) {
      setForm((prev) => {
        const newItems = [...prev.items];

        if (newItems[itemIndex]) {
          newItems[itemIndex] = { ...newItems[itemIndex], [name]: value };
        }

        return { ...prev, items: newItems };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...initialItem }],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      toast.error("You must have at least one item in the order.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const generateOrderId = () => {
    const newId = `SQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setForm((prev) => ({ ...prev, orderId: newId }));
    toast.info(`Generated Order ID: ${newId}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.customerName) return toast.error("Full Name is required");
    if (!form.mobile || form.mobile.length < 10) {
      return toast.error("Valid Mobile Number is required");
    }
    if (!form.address) return toast.error("Complete Address is required");
    if (!form.pincode || form.pincode.length !== 6) {
      return toast.error("Valid 6-digit Pincode is required");
    }
    if (!form.state) return toast.error("State is required");
    if (!form.city) return toast.error("City is required");
    if (!form.orderId) return toast.error("Order ID is required");
    if (!form.orderDate) return toast.error("Order Date is required");
    if (!form.paymentMode) return toast.error("Payment Mode is required");
    if (
      form.paymentMode === "COD" &&
      (!form.codAmount || Number(form.codAmount) <= 0)
    ) {
      return toast.error("COD Amount is required for COD orders");
    }

    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];

      if (!item.productName) {
        return toast.error(`Product Name is required for Item ${i + 1}`);
      }
      if (!item.category) {
        return toast.error(`Category is required for Item ${i + 1}`);
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        return toast.error(`Valid Quantity is required for Item ${i + 1}`);
      }
      if (!item.orderValue || Number(item.orderValue) <= 0) {
        return toast.error(`Valid Unit Value is required for Item ${i + 1}`);
      }
    }

    if (!form.physicalWeight || Number(form.physicalWeight) <= 0) {
      return toast.error("Weight is required");
    }
    if (!form.length || Number(form.length) <= 0) {
      return toast.error("Length is required");
    }
    if (!form.breadth || Number(form.breadth) <= 0) {
      return toast.error("Breadth is required");
    }
    if (!form.height || Number(form.height) <= 0) {
      return toast.error("Height is required");
    }
    if (!form.warehouseId) {
      return toast.error("Please select a Pickup Location (Warehouse)");
    }

    setSubmitting(true);
    const tid = toast.loading("Creating order...");

    const apiData = {
      ...form,
      items: form.items.map((item) => ({
        ...item,
        quantity: parseInt(String(item.quantity), 10) || 1,
        orderValue: parseFloat(String(item.orderValue)) || 0,
      })),
      physicalWeight: parseFloat(String(form.physicalWeight)) || 0,
      length: parseFloat(String(form.length)) || 0,
      breadth: parseFloat(String(form.breadth)) || 0,
      height: parseFloat(String(form.height)) || 0,
      codAmount:
        form.paymentMode === "COD" ? parseFloat(String(form.codAmount)) || 0 : 0,
    };

    try {
      await axios.post("/api/user/orders/single-order", apiData);
      toast.update(tid, {
        render: "Order created successfully! Redirecting...",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      setTimeout(() => {
        router.push("/user/dashboard/bulk");
      }, 2000);
    } catch (error: any) {
      toast.update(tid, {
        render: error.response?.data?.error || "Error occurred",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode }));
    setPincodeAutoFilled(false);

    if (pincode.length === 6) {
      setPincodeLoading(true);

      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();

        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          setForm((f) => ({
            ...f,
            state: data[0].PostOffice[0].State,
            city: data[0].PostOffice[0].District,
          }));
          setPincodeAutoFilled(true);
          setPincodeLoading(false);
          return;
        }
      } catch {
        // ignore and try fallback API
      }

      try {
        const res2 = await fetch(
          `https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&filters%5Bpincode%5D=${pincode}`
        );
        const data2 = await res2.json();

        if (data2?.records?.length > 0) {
          setForm((f) => ({
            ...f,
            state: data2.records[0].statename || "",
            city: data2.records[0].districtname || data2.records[0].officename || "",
          }));
          setPincodeAutoFilled(true);
          setPincodeLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      setPincodeAutoFilled(false);
      setPincodeLoading(false);
    } else if (pincode.length === 0) {
      setForm((f) => ({ ...f, state: "", city: "" }));
    }
  };

  const handleWarehouseFromDB = async () => {
    if (warehouses.length > 0) return;

    try {
      const response = await axios.get("/api/user/warehouses");
      const data = response.data.warehouses || [];
      setWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Could not load warehouses.");
    }
  };

  useEffect(() => {
    handleWarehouseFromDB();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-[#0a0c37] dark:text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="font-bold opacity-60">Loading order details...</p>
      </div>
    );
  }

  return (
    <KycGuard>
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0a0c37] dark:text-white">
              Clone Order
            </h1>
            <p className="mt-1 text-sm font-bold text-gray-400">
              Cloning details from <span className="text-indigo-500">#{orderId}</span>{" "}
              to create a new shipment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/user/dashboard"
              className="flex items-center transition-colors hover:text-[#0a0c37] dark:hover:text-indigo-400"
            >
              <Home className="mr-1 h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="mx-1 h-3.5 w-3.5" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Clone Order
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-indigo-900/5 dark:border-gray-800 dark:bg-gray-900 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="transition-all duration-200">
              <div className="mb-3 flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0c37] text-xs font-bold text-white shadow-sm">
                  1
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Consignee Details
                </span>
              </div>

              <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="customerName"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Customer Full Name"
                    value={form.customerName}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Mobile No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="mobile"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Mobile No."
                    value={form.mobile}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Email(Optional)
                  </label>
                  <input
                    name="email"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Email ID"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section className="transition-all duration-200">
              <div className="mb-3 flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0c37] text-xs font-bold text-white shadow-sm">
                  2
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Customer Address
                </span>
              </div>

              <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pincode"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={handlePincodeChange}
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pincodeLoading && (
                    <span className="absolute right-2 top-[30px]">
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="state"
                    className={`w-full rounded-md border border-gray-300 p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled ? "cursor-not-allowed bg-green-50/50" : "bg-white"
                    }`}
                    placeholder="State"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    value={form.state}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    className={`w-full rounded-md border border-gray-300 p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled ? "cursor-not-allowed bg-green-50/50" : "bg-white"
                    }`}
                    placeholder="City"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    value={form.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Landmark
                  </label>
                  <input
                    name="landmark"
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Landmark"
                    value={form.landmark}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center border-b border-gray-50 pb-1 text-base font-bold text-gray-800 dark:border-gray-800 dark:text-gray-200">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0c37] text-xs font-bold text-white shadow-sm">
                  3
                </span>
                Order Details
              </h2>

              <div className="mb-4 grid grid-cols-1 items-end gap-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <label
                    htmlFor="orderId"
                    className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                  >
                    Order Id <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative">
                    <input
                      type="text"
                      id="orderId"
                      name="orderId"
                      value={form.orderId}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-1.5 pr-8 text-xs font-bold text-gray-700 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={generateOrderId}
                      title="Regenerate ID"
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[#0a0c37]"
                    >
                      <RefreshCcw
                        size={12}
                        className="transition-transform duration-500 group-hover:rotate-180"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="orderDate"
                    className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                  >
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="orderDate"
                    name="orderDate"
                    value={form.orderDate}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-1.5 text-xs shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {["Prepaid", "COD"].map((mode) => (
                      <label
                        key={mode}
                        className={`flex grow cursor-pointer items-center justify-center gap-2 rounded-lg border p-1.5 transition-all ${
                          form.paymentMode === mode
                            ? "border-[#0a0c37] bg-[#0a0c37] text-white shadow-md ring-1 ring-[#0a0c37]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value={mode}
                          checked={form.paymentMode === mode}
                          onChange={handleChange}
                          className="hidden"
                        />
                        {mode === "Prepaid" ? (
                          <CreditCard size={12} />
                        ) : (
                          <ShoppingBag size={12} />
                        )}
                        <span className="text-xs font-bold uppercase tracking-tight">
                          {mode}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.paymentMode === "COD" && (
                  <div>
                    <label
                      htmlFor="codAmount"
                      className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                    >
                      COD Amount(₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="codAmount"
                      name="codAmount"
                      value={form.codAmount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 p-1.5 text-xs shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Amt."
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Items Inventory <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex cursor-pointer items-center rounded-md border border-dashed border-blue-500 bg-white px-2 py-1 text-[10px] font-bold text-[#0a0c37] transition-all hover:bg-gray-100 dark:bg-blue-900/10 dark:text-blue-300"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                  </button>
                </div>

                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-gray-100 bg-gray-50/30 p-2 dark:border-gray-700 dark:bg-gray-800/30"
                  >
                    <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-6">
                      <div className="md:col-span-2">
                        <label className="mb-0.5 block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="productName"
                          value={item.productName}
                          onChange={(e) => handleChange(e, index)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={item.category}
                          onChange={(e) => handleChange(e, index)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                        >
                          <option value="">Select</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Fashion & Clothing">
                            Fashion & Clothing
                          </option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">
                          Qty <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleChange(e, index)}
                          min="1"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">
                          Value(Unit) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="orderValue"
                          value={item.orderValue}
                          onChange={(e) => handleChange(e, index)}
                          min="0"
                          step="0.01"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>

                      <div className="flex items-end gap-1">
                        <div className="grow">
                          <label className="mb-0.5 block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">
                            HSN
                          </label>
                          <input
                            type="text"
                            name="hsn"
                            value={item.hsn}
                            onChange={(e) => handleChange(e, index)}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                          />
                        </div>

                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="cursor-pointer rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div>
                  <label
                    htmlFor="physicalWeight"
                    className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                  >
                    Weight(KG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="physicalWeight"
                    name="physicalWeight"
                    value={form.physicalWeight}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border border-gray-300 p-1.5 text-xs shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. 0.5"
                  />
                </div>

                {["length", "breadth", "height"].map((dim) => (
                  <div key={dim} className="group relative">
                    <label
                      htmlFor={dim}
                      className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                    >
                      {dim}(CM) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id={dim}
                        name={dim}
                        value={form[dim as keyof FormState] as string}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 p-1.5 pr-8 text-xs shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold text-gray-400">
                        CM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="transition-all duration-200">
              <div className="mb-3 flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0c37] text-xs font-bold text-white shadow-sm">
                  4
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Pickup Location
                </span>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Search Pickup Location"
                  value={form.pickupLocation}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      pickupLocation: e.target.value,
                      warehouseId: null,
                    }));
                  }}
                  onFocus={handleWarehouseFromDB}
                />

                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(true)}
                  className="w-max cursor-pointer rounded-md bg-[#0a0c37] px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-200 hover:opacity-90 md:ml-auto md:w-auto"
                >
                  + Add Warehouse
                </button>
              </div>

              <div className="w-full">
                {warehouses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 py-4 text-center text-xs text-gray-500 dark:border-gray-700">
                    No warehouses found. Click the button above to add one.
                  </div>
                ) : (
                  <div className="custom-scrollbar max-h-[300px] overflow-y-auto pb-4 pr-2">
                    <div className="grid grid-cols-1 gap-4 p-2 lg:grid-cols-2">
                      {(form.pickupLocation && !form.warehouseId
                        ? warehouses.filter(
                            (w) =>
                              w.warehouseName
                                .toLowerCase()
                                .includes(form.pickupLocation.toLowerCase()) ||
                              w.city
                                .toLowerCase()
                                .includes(form.pickupLocation.toLowerCase()) ||
                              w.state
                                .toLowerCase()
                                .includes(form.pickupLocation.toLowerCase()) ||
                              w.pincode.includes(form.pickupLocation)
                          )
                        : warehouses
                      ).map((w) => {
                        const isSelected = form.warehouseId === w.id;

                        return (
                          <div
                            key={w.id}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                pickupLocation: w.warehouseName,
                                warehouseId: w.id,
                              }))
                            }
                            className={`group relative flex cursor-pointer rounded-xl border p-3 transition-all duration-300 ${
                              isSelected
                                ? "border-[#0a0c37] bg-indigo-50/10 shadow-lg ring-1 ring-[#0a0c37]"
                                : "border-gray-100 bg-white hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 animate-in zoom-in-50 rounded-full bg-[#0a0c37] p-1 text-white shadow-lg ring-2 ring-white">
                                <CheckCircle2 size={10} strokeWidth={4} />
                              </div>
                            )}

                            <div className="grid w-full grid-cols-5 gap-3">
                              <div className="col-span-2 border-r border-gray-50 pr-2 dark:border-gray-700">
                                <div
                                  className={`mb-0.5 truncate text-[11px] font-black uppercase tracking-tight ${
                                    isSelected
                                      ? "text-[#0a0c37] dark:text-indigo-400"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {w.warehouseName}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700">
                                    📞
                                  </div>
                                  {w.phone || w.mobile || "988109XXXX"}
                                </div>
                              </div>

                              <div className="col-span-3">
                                <div className="mb-1 flex items-start gap-1">
                                  <MapPin
                                    size={10}
                                    className="mt-0.5 shrink-0 text-gray-400"
                                  />
                                  <span className="line-clamp-2 text-[10px] font-medium leading-tight text-gray-500">
                                    {w.address1}, {w.city}, {w.state}
                                  </span>
                                </div>
                                <div className="ml-3.5 text-[10px] font-black text-indigo-400">
                                  {w.pincode}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-[#0a0c37] px-12 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-900/10 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </div>
                ) : (
                  "Clone Order"
                )}
              </button>
            </div>
          </form>

          <AddWarehouseModal
            open={showWarehouseModal}
            onClose={() => setShowWarehouseModal(false)}
            onSuccess={handleWarehouseFromDB}
          />
        </div>
      </div>
    </KycGuard>
  );
}