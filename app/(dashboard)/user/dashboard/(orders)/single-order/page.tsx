"use client";

import { useEffect, useState } from "react";
import type React from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";
import KycGuard from "@/components/isKycDone";
import { toast } from "react-toastify";
import {
  ChevronDown,
  CreditCard,
  FileCheck,
  Home,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  id?: number;
  productName: string;
  category: string;
  quantity: number | string;
  orderValue: number | string;
  hsn: string;
}

interface FormState {
  orderId: string;
  orderDate: string;
  paymentMode: string;
  items: OrderItem[];
  physicalWeight: number | string;
  length: number | string;
  breadth: number | string;
  height: number | string;
  pickupLocation: string;
  warehouseId?: number | null;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  pincode: string;
  state: string;
  city: string;
  landmark: string;
  codAmount?: number | string;
  ewaybill?: string;
}

export default function SingleOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderInfo, setCreatedOrderInfo] = useState<{ id: string; orderId: string } | null>(null);

  const initialItem: OrderItem = {
    productName: "",
    category: "",
    quantity: 1,
    orderValue: "",
    hsn: "",
  };

  const [form, setForm] = useState<FormState>({
    orderId: "",
    orderDate: new Date().toISOString().split("T")[0],
    paymentMode: "",
    items: [initialItem],
    physicalWeight: "",
    length: "",
    breadth: "",
    height: "",
    pickupLocation: "",
    warehouseId: null,
    customerName: "",
    mobile: "",
    email: "",
    address: "",
    pincode: "",
    state: "",
    city: "",
    landmark: "",
    codAmount: "",
    ewaybill: "",
  });

  useEffect(() => {
    handleWarehouseFromDB();
    if (!form.orderId) {
      generateOrderId();
    }
  }, []);

  const generateOrderId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let autoId = "";

    for (let i = 0; i < 10; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setForm((f) => ({ ...f, orderId: `SQ-${autoId}` }));
  };

  const handleWarehouseFromDB = async () => {
    try {
      const resp = await axios.get("/api/user/warehouses");
      if (resp.data.warehouses) {
        const warehouseData = resp.data.warehouses;
        setWarehouses(warehouseData);

        // Auto-select first warehouse if none selected
        if (!form.warehouseId && warehouseData.length > 0) {
          const firstW = warehouseData[0];
          setForm((f) => ({
            ...f,
            pickupLocation: firstW.warehouseName,
            warehouseId: firstW.id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching warehouses", error);
    }
  };

  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: value }));

    if (value.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setForm((f) => ({ 
            ...f, 
            state: postOffice.State || "", 
            city: postOffice.District || "" 
          }));
          setPincodeAutoFilled(true);
        } else {
          setPincodeAutoFilled(false);
        }
      } catch (err) {
        setPincodeAutoFilled(false);
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeAutoFilled(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number
  ) => {
    const { name, value } = e.target;

    if (index !== undefined) {
      const newItems = [...form.items];
      (newItems[index] as any)[name] = value;
      setForm((f) => ({ ...f, items: newItems }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { ...initialItem }] }));
  };

  const removeItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, items: newItems }));
  };

  const totalOrderValue = form.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const val = Number(item.orderValue) || 0;
    return sum + qty * val;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Single Order Form...", form);

    if (!form.customerName) {
      toast.error("Candidate Name is required.");
      return;
    }
    if (!form.mobile || form.mobile.length < 10) {
      toast.error("Valid Mobile Number is required.");
      return;
    }
    if (!form.address) {
      toast.error("Complete Address is required.");
      return;
    }
    if (!form.pincode || form.pincode.length !== 6) {
      toast.error("Valid 6-digit Pincode is required.");
      return;
    }
    if (!form.orderId) {
      toast.error("Order ID is required.");
      return;
    }
    if (!form.paymentMode) {
      toast.error("Please select a Payment Mode (Prepaid or COD).");
      return;
    }
    if (form.items.some(item => !item.productName)) {
      toast.error("Product Name is required for all items.");
      return;
    }
    if (form.items.some(item => !item.quantity || Number(item.quantity) <= 0)) {
      toast.error("Valid Quantity is required for all items.");
      return;
    }
    if (form.items.some(item => !item.orderValue || Number(item.orderValue) <= 0)) {
      toast.error("Valid Order Value is required for all items.");
      return;
    }

    if (!form.physicalWeight || Number(form.physicalWeight) <= 0) {
      toast.error("Physical Weight is required.");
      return;
    }
    if (!form.length || !form.breadth || !form.height) {
      toast.error("All dimensions (L, B, H) are required.");
      return;
    }

    if (!form.warehouseId) {
      toast.error("Please select a Pickup Warehouse.");
      return;
    }

    if (
      form.paymentMode === "COD" &&
      (!form.codAmount || Number(form.codAmount) <= 0)
    ) {
      toast.error("COD Amount is required for COD orders.");
      return;
    }
    setSubmitting(true);
    const tid = toast.loading("Adding order...");

    try {
      const resp = await axios.post("/api/user/orders/single-order", form);
      if (resp.data.id || resp.data.orderId) {
        toast.update(tid, {
          render: "Order added successfully!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        
        setCreatedOrderInfo({ 
          id: resp.data.id || "", 
          orderId: resp.data.orderId || form.orderId 
        });
        setShowSuccessDialog(true);
      } else {
        toast.update(tid, {
          render: resp.data.error || "Failed to add order",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
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

  const handleCreateAnother = () => {
    // Reset form while keeping warehouse if desired, or reset everything
    const newOrderId = `SQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setForm({
      ...form,
      orderId: newOrderId,
      customerName: "",
      mobile: "",
      email: "",
      address: "",
      pincode: "",
      state: "",
      city: "",
      landmark: "",
      codAmount: "",
      ewaybill: "",
      items: [initialItem],
    });
    setPincodeAutoFilled(false);
    setShowSuccessDialog(false);
    toast.info("Form reset for next order.");
  };

  return (
    <KycGuard>
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0a0c37] dark:text-white">
              Add Single Order
            </h1>
            <p className="mt-1 text-sm font-bold text-gray-400">
              Fill details to add a new shipment to your dashboard.
            </p>
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
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Customer Full Name"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerName: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Mobile No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Mobile No."
                    value={form.mobile}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobile: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Email(Optional)
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Email ID"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
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
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Address"
                    required
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>

                <div className="relative">
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Pincode"
                    required
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
                    className={`w-full rounded-md border border-gray-300 p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled
                        ? "cursor-not-allowed bg-green-50/50"
                        : "bg-white"
                    }`}
                    placeholder="State"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    required
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full rounded-md border border-gray-300 p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled
                        ? "cursor-not-allowed bg-green-50/50"
                        : "bg-white"
                    }`}
                    placeholder="City"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    required
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Landmark
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-xs text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Landmark"
                    value={form.landmark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, landmark: e.target.value }))
                    }
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

              {totalOrderValue >= 50000 && (
                <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20 md:col-span-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="ewaybill"
                      className="shrink-0 text-[10px] font-black uppercase text-yellow-800 dark:text-yellow-400"
                    >
                      E-way Bill No:
                    </label>
                    <input
                      type="text"
                      id="ewaybill"
                      name="ewaybill"
                      value={form.ewaybill}
                      onChange={handleChange}
                      placeholder="Enter 12-digit E-Way Bill No."
                      className="grow rounded border border-yellow-300 bg-white p-1 text-xs outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:border-yellow-700 dark:bg-gray-800"
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-yellow-700 dark:text-yellow-500">
                    ⚠️ Mandatory for orders exceeding ₹50,000.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    Items Inventory <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex cursor-pointer items-center rounded-md border border-dashed border-blue-500 bg-white px-2 py-1 text-[10px] font-bold text-[#0a0c37] transition-all hover:bg-gray-100 hover:shadow-sm dark:bg-blue-900/10 dark:text-blue-300 dark:hover:bg-blue-800/30"
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
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs shadow-none outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
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
                          required
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs shadow-none outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                        >
                          <option value="">Select</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Fashion & Clothing">
                            Fashion & Clothing
                          </option>
                          <option value="Book & Stationary">
                            Book & Stationary
                          </option>
                          <option value="Electronics">Electronics</option>
                          <option value="FMCG">FMCG</option>
                          <option value="Footwear">Footwear</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                          <option value="Toys">Toys</option>
                          <option value="Sports Equipment">
                            Sports Equipment
                          </option>
                          <option value="Wellness">Wellness</option>
                          <option value="Medicines">Medicines</option>
                          <option value="Other">Other</option>
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
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs shadow-none outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
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
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs shadow-none outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
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
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs shadow-none outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
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
                  <div className="relative">
                    <input
                      type="number"
                      id="physicalWeight"
                      name="physicalWeight"
                      value={form.physicalWeight}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 p-1.5 pr-8 text-xs shadow-sm outline-none focus:border-[#0a0c37] focus:ring-1 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold text-gray-400">
                      KG
                    </span>
                  </div>
                </div>

                {["length", "breadth", "height"].map((dim) => (
                  <div key={dim}>
                    <label
                      htmlFor={dim}
                      className="mb-1 block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400"
                    >
                      {dim.charAt(0).toUpperCase() + dim.slice(1)}(CM) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id={dim}
                        name={dim}
                        value={(form as any)[dim]}
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
                    No warehouses found.Click the button above to add one.
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
                                <FileCheck size={10} strokeWidth={4} />
                              </div>
                            )}

                            <div className="grid w-full grid-cols-5 gap-3">
                              {/* Left Side: Primary Info */}
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

                              {/* Right Side: Address */}
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
                  "Add Order"
                )}
              </button>
            </div>
          </form>

          <AddWarehouseModal
            open={showWarehouseModal}
            onClose={() => setShowWarehouseModal(false)}
            onSuccess={handleWarehouseFromDB}
          />

          <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <AlertDialogContent className="max-w-md rounded-3xl border-none bg-white p-8 shadow-2xl dark:bg-gray-900">
              <AlertDialogHeader className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-8 ring-emerald-50/50 dark:bg-emerald-900/20 dark:ring-emerald-900/10">
                  <CheckCircle2 size={40} strokeWidth={2.5} className="animate-in zoom-in-50 duration-500" />
                </div>
                <div className="space-y-2">
                  <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-[#0a0c37] dark:text-white">
                    Order Created!
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-bold text-gray-500">
                    Shipment <span className="text-indigo-600 dark:text-indigo-400">#{createdOrderInfo?.orderId}</span> has been successfully manifested. Do you want to create another order?
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => router.push("/user/dashboard/bulk")}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-10 py-3 text-sm font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 active:scale-95 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                >
                  No
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0a0c37] px-10 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-900/20 transition-all hover:opacity-90 active:scale-95"
                >
                  Yes <ArrowRight size={14} />
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </KycGuard>
  );
}