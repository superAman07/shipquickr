"use client";

import { useEffect, useState } from "react";
import type React from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";
import KycGuard from "@/components/isKycDone";
import { toast } from "react-toastify";
import {
  ChevronRight,
  FileCheck,
  Home,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

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

interface Order {
  id: number;
  orderId: string;
  orderDate: string;
  paymentMode: string;
  items: OrderItem[];
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
  pickupLocation: string;
  customerName: string;
  mobile: string;
  email: string | null;
  address: string;
  pincode: string;
  state: string;
  city: string;
  landmark: string | null;
  status: string;
  codAmount?: number | null;
  awbNumber?: string | null;
  courierName?: string | null;
  createdAt: string;
}

export default function SingleOrderPage() {
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const initialItem: OrderItem = {
    productName: "",
    category: "",
    quantity: 1,
    orderValue: "",
    hsn: "",
  };

  const initialForm: FormState = {
    orderId: "",
    orderDate: new Date().toISOString().split("T")[0],
    paymentMode: "",
    items: [initialItem],
    physicalWeight: "",
    length: "",
    breadth: "",
    height: "",
    pickupLocation: "",
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
  };

  const [form, setForm] = useState<FormState>(initialForm);

  const handleWarehouseFromDB = async () => {
    try {
      const response = await axios.get("/api/user/warehouses");
      const data = response.data.warehouses || [];
      setWarehouses(data);
    } catch {}
  };

  useEffect(() => {
    handleWarehouseFromDB();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    index?: number
  ) => {
    const { name, value } = e.target;

    if (
      index !== undefined &&
      ["productName", "category", "quantity", "orderValue", "hsn"].includes(name)
    ) {
      setForm((prev) => {
        const newItems = [...prev.items];
        if (newItems[index]) {
          newItems[index] = {
            ...newItems[index],
            [name]: value,
          };
        }
        return { ...prev, items: newItems };
      });
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
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
    const prefix = "SQ";
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    setForm((prev) => ({
      ...prev,
      orderId: `${prefix}${datePart}${randomPart}`,
    }));
  };

  const totalOrderValue = form.items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.orderValue || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Adding order...");

    if (
      !form.orderId ||
      !form.orderDate ||
      !form.paymentMode ||
      !form.pickupLocation ||
      !form.customerName ||
      !form.mobile ||
      !form.address ||
      !form.pincode ||
      !form.state ||
      !form.city ||
      !form.physicalWeight ||
      !form.length ||
      !form.breadth ||
      !form.height
    ) {
      toast.error("Please fill all required fields marked with *");
      setSubmitting(false);
      return;
    }

    if (
      form.items.some(
        (item) => !item.productName || !item.category || !item.quantity || !item.orderValue
      )
    ) {
      toast.error("Please fill all required fields for each item.");
      setSubmitting(false);
      return;
    }

    if (
      form.paymentMode === "COD" &&
      (!form.codAmount || isNaN(Number(form.codAmount)) || Number(form.codAmount) <= 0)
    ) {
      toast.error("Please enter a valid COD Amount for COD orders.");
      setSubmitting(false);
      return;
    }

    if (totalOrderValue >= 50000 && !form.ewaybill) {
      toast.error("E-Way Bill Number is mandatory for orders above ₹50,000");
      setSubmitting(false);
      return;
    }

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
        form.paymentMode === "COD" ? parseFloat(String(form.codAmount)) || 0 : undefined,
      ewaybill: form.ewaybill,
    };

    if (apiData.paymentMode !== "COD") {
      delete apiData.codAmount;
    }

    try {
      await axios.post("/api/user/orders/single-order", apiData, {
        headers: { "Content-Type": "application/json" },
      });

      toast.update(toastId, {
        render: "Order added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setForm(initialForm);
    } catch (error: any) {
      console.error("Failed to add order:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "An unknown error occurred";

      toast.update(toastId, {
        render: `Failed to add order: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
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
      } catch {}

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
      } catch {}

      setPincodeAutoFilled(false);
      setPincodeLoading(false);
    } else {
      if (pincode.length === 0) {
        setForm((f) => ({ ...f, state: "", city: "" }));
      }
    }
  };

  return (
    <>
      <div className="px-4 pt-4 pb-2 sm:pt-6 sm:px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#0a0c37] dark:text-indigo-400">
            <FileCheck className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
              Add Single Order
            </h1>
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
              Single Order
            </span>
          </div>
        </div>
      </div>

      <KycGuard>
        <div className="mx-auto w-full max-w-full p-4 sm:p-6 lg:px-8">
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800 sm:p-8">
            <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white sm:text-2xl">
              Add Single Order
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="transition-all duration-200">
                <div className="mb-4 flex items-center">
                  <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0c37] font-bold text-white shadow-sm">
                    1
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Consignee Details
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Customer Full Name *"
                    required
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerName: e.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Mobile No. *"
                    required
                    value={form.mobile}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobile: e.target.value }))
                    }
                  />
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Email ID"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </section>

              <section className="transition-all duration-200">
                <div className="mb-4 flex items-center">
                  <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0c37] font-bold text-white shadow-sm">
                    2
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Customer Address
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <input
                    className="col-span-2 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Complete Address *"
                    required
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />

                  <div className="relative">
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Pincode *"
                      required
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      maxLength={6}
                      inputMode="numeric"
                    />
                    {pincodeLoading && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </span>
                    )}
                  </div>

                  <input
                    className={`w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled ? "cursor-not-allowed bg-green-50/50" : "bg-white"
                    }`}
                    placeholder="State *"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    required
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  />

                  <input
                    className={`w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      pincodeAutoFilled ? "cursor-not-allowed bg-green-50/50" : "bg-white"
                    }`}
                    placeholder="City *"
                    readOnly={pincodeAutoFilled}
                    tabIndex={pincodeAutoFilled ? -1 : 0}
                    required
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />

                  <input
                    className="col-span-2 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Famous Landmark"
                    value={form.landmark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, landmark: e.target.value }))
                    }
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-4 flex items-center border-b pb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0c37] font-bold text-white shadow-sm">
                    3
                  </span>
                  Order Details
                </h2>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="orderId"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Order Id <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="orderId"
                        name="orderId"
                        value={form.orderId}
                        onChange={handleChange}
                        required
                        className="grow rounded-l-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={generateOrderId}
                        className="cursor-pointer rounded-r-md border border-l-0 border-[#0a0c37] bg-gray-100 px-3 py-2 text-xs text-[#0a0c37] transition-colors hover:bg-gray-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/60"
                      >
                        Auto Generate ID
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="orderDate"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Order Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="orderDate"
                      name="orderDate"
                      value={form.orderDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="paymentMode"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paymentMode"
                      name="paymentMode"
                      value={form.paymentMode}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select</option>
                      <option value="Prepaid">Prepaid</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>

                  {form.paymentMode === "COD" && (
                    <div className="md:col-start-2">
                      <label
                        htmlFor="codAmount"
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        COD Amount(₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="codAmount"
                        name="codAmount"
                        value={form.codAmount}
                        onChange={handleChange}
                        required={form.paymentMode === "COD"}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Total amount to collect"
                      />
                    </div>
                  )}

                  {totalOrderValue >= 50000 && (
                    <div className="md:col-span-3 mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <div className="flex items-start">
                        <div className="grow">
                          <label
                            htmlFor="ewaybill"
                            className="mb-1 block text-sm font-bold text-gray-800 dark:text-gray-100"
                          >
                            E-Way Bill Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="ewaybill"
                            name="ewaybill"
                            value={form.ewaybill}
                            onChange={handleChange}
                            required
                            placeholder="Enter 12-digit E-Way Bill No."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-yellow-500 focus:ring-yellow-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                            ⚠️ Mandatory for orders exceeding ₹50,000.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Items <span className="text-red-500">*</span>
                  </label>

                  {form.items.map((item, index) => (
                    <div
                      key={index}
                      className="relative rounded-md border border-gray-200 p-4 transition-all duration-200 dark:border-gray-700"
                    >
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute top-2 right-2 rounded-full p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          aria-label="Remove Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`productName-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Product Name
                          </label>
                          <input
                            type="text"
                            id={`productName-${index}`}
                            name="productName"
                            value={item.productName}
                            onChange={(e) => handleChange(e, index)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`category-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Category
                          </label>
                          <select
                            id={`category-${index}`}
                            name="category"
                            value={item.category}
                            onChange={(e) => handleChange(e, index)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                          <label
                            htmlFor={`quantity-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Quantity
                          </label>
                          <input
                            type="number"
                            id={`quantity-${index}`}
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleChange(e, index)}
                            required
                            min="1"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`orderValue-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Value(per item)
                          </label>
                          <input
                            type="number"
                            id={`orderValue-${index}`}
                            name="orderValue"
                            value={item.orderValue}
                            onChange={(e) => handleChange(e, index)}
                            required
                            min="0"
                            step="0.01"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label
                            htmlFor={`hsn-${index}`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            HSN
                          </label>
                          <input
                            type="text"
                            id={`hsn-${index}`}
                            name="hsn"
                            value={item.hsn}
                            onChange={(e) => handleChange(e, index)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center rounded-md border border-dashed border-blue-500 bg-white px-4 py-2 text-sm font-medium text-[#0a0c37] transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0a0c37] focus:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add More Item
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label
                      htmlFor="physicalWeight"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Physical Weight <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="physicalWeight"
                        name="physicalWeight"
                        value={form.physicalWeight}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">
                        KG
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="length"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Length <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="length"
                        name="length"
                        value={form.length}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">
                        CM
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="breadth"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Breadth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="breadth"
                        name="breadth"
                        value={form.breadth}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">
                        CM
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="height"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Height <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="height"
                        name="height"
                        value={form.height}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 shadow-sm outline-none focus:border-[#0a0c37] focus:ring-[#0a0c37] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">
                        CM
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="transition-all duration-200" onMouseEnter={handleWarehouseFromDB}>
                <div className="mb-4 flex items-center">
                  <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0c37] font-bold text-white shadow-sm">
                    4
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
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
                    required
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
                    <div className="rounded-lg border border-dashed border-gray-300 py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No warehouses found.Click the button above to add one.
                    </div>
                  ) : (
                    <div className="custom-scrollbar max-h-[400px] overflow-y-auto pr-2 pb-2">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                              className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg p-4 text-center shadow-sm transition-all duration-200 ${
                                isSelected
                                  ? "bg-[#0a0c37] border-[#0a0c37] text-white shadow-md transform scale-[1.01]"
                                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:shadow-md"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-3 right-3 rounded-full bg-white p-0.5 text-[#0a0c37] shadow-sm">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                              )}

                              <div className="mb-1 text-sm font-bold uppercase tracking-wide">
                                {w.warehouseName}
                              </div>
                              <div className="mb-2 text-sm font-semibold opacity-90">
                                {w.phone || w.mobile || "9891094700"}
                              </div>
                              <div className="max-w-[280px] text-xs uppercase leading-relaxed opacity-80">
                                {w.address1 && `${w.address1}, `}
                                {w.city}, {w.state} - {w.pincode}
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
                  className="cursor-pointer rounded-md bg-[#0a0c37] px-8 py-2 font-semibold text-white shadow-md transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Order"}
                </button>
              </div>
            </form>

            <AddWarehouseModal
              open={showWarehouseModal}
              onClose={() => setShowWarehouseModal(false)}
              onSuccess={() => {}}
            />
          </div>

          <div className="hidden">
            {/* Legacy My Orders Table completely removed to preserve UI parity matching current bulk strategy */}
          </div>
        </div>
      </KycGuard>
    </>
  );
}