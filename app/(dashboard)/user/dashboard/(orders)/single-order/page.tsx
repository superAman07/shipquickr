"use client"
import { useEffect, useState } from "react"
import type React from "react"
import axios from "axios"
import AddWarehouseModal from "@/components/AddWarehouse"
import KycGuard from "@/components/isKycDone"
import { toast } from "react-toastify"
import { ChevronRight, FileCheck, Home, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id?: number;
  productName: string;
  category: string;
  quantity: number|string;
  orderValue: number|string;
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
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  pincode: string;
  state: string;
  city: string;
  landmark: string;
  codAmount?: number | string; 
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
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)

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
  };
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    setLoading(true)
    axios
      .get("/api/user/orders/single-order")
      .then((res) => setOrders(res.data.orders || []))
      .finally(() => setLoading(false))
  }, [submitting])
  const handleWarehouseFromDB = async () => {
    try {
      const response = await axios.get("/api/user/warehouses")
      const data = response.data.warehouses || []
      setWarehouses(data)
    } catch {}
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    index?: number 
  ) => {
    const { name, value } = e.target;

    if (index !== undefined && ['productName', 'category', 'quantity', 'orderValue', 'hsn'].includes(name)) { // Check if the change is for an item field
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
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm(prev => ({ ...prev, orderId: `${prefix}-${timestamp}-${randomSuffix}` }));
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const toastId = toast.loading("Adding order...");
    if (!form.orderId || !form.orderDate || !form.paymentMode || !form.pickupLocation || !form.customerName || !form.mobile || !form.address || !form.pincode || !form.state || !form.city || !form.physicalWeight || !form.length || !form.breadth || !form.height) {
      toast.error("Please fill all required fields marked with *");
      setSubmitting(false);
      return;
    } 
    if (form.items.some(item => !item.productName || !item.category || !item.quantity || !item.orderValue)) {
        toast.error("Please fill all required fields for each item.");
        setSubmitting(false);
        return;
    }
    if (form.paymentMode === "COD" && (!form.codAmount || isNaN(Number(form.codAmount)) || Number(form.codAmount) <= 0)) {
        toast.error("Please enter a valid COD Amount for COD orders.");
        setSubmitting(false);
        return;
    }
    const apiData = {
      ...form,
      items: form.items.map(item => ({
          ...item,
          quantity: parseInt(String(item.quantity)) || 0, 
          orderValue: parseFloat(String(item.orderValue)) || 0, 
      })),
      physicalWeight: parseFloat(String(form.physicalWeight)) || 0,
      length: parseFloat(String(form.length)) || 0,
      breadth: parseFloat(String(form.breadth)) || 0,
      height: parseFloat(String(form.height)) || 0,
      codAmount: form.paymentMode === "COD" ? parseFloat(String(form.codAmount)) || 0 : undefined,
    };

    if (apiData.paymentMode !== "COD") {
        delete apiData.codAmount;
    }
      try {
        const response = await axios.post("/api/user/orders/single-order", apiData ,{
          headers: { "Content-Type": "application/json" }, 
        });
        toast.update(toastId, { render: "Order added successfully!", type: "success", isLoading: false, autoClose: 5000 });
        setForm(initialForm)
      } catch (error: any) {
        console.error("Failed to add order:", error);
        const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
        toast.update(toastId, { render: `Failed to add order: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
      } finally {
        setSubmitting(false);

      }
  }

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value
    setForm((f) => ({ ...f, pincode }))
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        const data = await res.json()
        if (data[0].Status === "Success") {
          setForm((f) => ({
            ...f,
            state: data[0].PostOffice[0].State,
            city: data[0].PostOffice[0].District,
          }))
        }
      } catch {}
    }
  }

  

  return (
    <>
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center justify-end gap-2 dark:text-amber-50">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  Add Single Order
                </h1>
              </div> 
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link
                  href="/user/dashboard"
                  className="flex items-center hover:text-gray-300 transition-colors min-w-0 shrink-0"
                >
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  <span className="truncate">Dashboard</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium truncate">Single Order</span>
              </div>
            </div>  
          </div>
        </div>
      </header>
    
    <KycGuard>
      <div className="max-w-6xl mx-auto p-2 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 mb-8 transition-colors duration-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add Single Order</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">
                  1
                </span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Consignee Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Customer Full Name *"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Mobile No. *"
                  required
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Email ID"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </section>

            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">
                  2
                </span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Customer Address</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md col-span-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Complete Address *"
                  required
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Pincode *"
                  required
                  value={form.pincode}
                  onChange={handlePincodeChange}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200 cursor-not-allowed"
                  placeholder="State *"
                  readOnly
                  tabIndex={-1}
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200 cursor-not-allowed"
                  placeholder="City *"
                  readOnly
                  tabIndex={-1}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md col-span-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Famous Landmark"
                  value={form.landmark}
                  onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                />
              </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-800 dark:text-gray-200 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 text-sm">3</span>
                    Order Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Id <span className="text-red-500">*</span></label>
                    <div className="flex">
                        <input type="text" id="orderId" name="orderId" value={form.orderId} onChange={handleChange} required className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <button type="button" onClick={generateOrderId} className="px-3 py-2 border border-l-0 border-blue-600 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-r-md text-xs hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors">
                            Auto Generate ID
                        </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Date <span className="text-red-500">*</span></label>
                    <input type="date" id="orderDate" name="orderDate" value={form.orderDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                    <select id="paymentMode" name="paymentMode" value={form.paymentMode} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">Select</option>
                      <option value="Prepaid">Prepaid</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                   {form.paymentMode === 'COD' && (
                    <div className="md:col-start-2"> 
                        <label htmlFor="codAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">COD Amount (₹) <span className="text-red-500">*</span></label>
                        <input
                        type="number"
                        id="codAmount"
                        name="codAmount"
                        value={form.codAmount}
                        onChange={handleChange} 
                        required={form.paymentMode === 'COD'}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Total amount to collect"
                        />
                    </div>
                    )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items <span className="text-red-500">*</span></label>
                  {form.items.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md relative transition-all duration-200">
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)} 
                          className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          aria-label="Remove Item"
                        >
                          <Trash2 size={18} /> 
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor={`productName-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                          <input type="text" id={`productName-${index}`} name="productName" value={item.productName} onChange={(e) => handleChange(e, index)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label htmlFor={`category-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                          <select id={`category-${index}`} name="category" value={item.category} onChange={(e) => handleChange(e, index)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                            <option value="">Select</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`quantity-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                          <input type="number" id={`quantity-${index}`} name="quantity" value={item.quantity} onChange={(e) => handleChange(e, index)} required min="1" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label htmlFor={`orderValue-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value (per item)</label>
                          <input type="number" id={`orderValue-${index}`} name="orderValue" value={item.orderValue} onChange={(e) => handleChange(e, index)} required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        </div>
                        <div className="md:col-span-1">
                          <label htmlFor={`hsn-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">HSN</label>
                          <input type="text" id={`hsn-${index}`} name="hsn" value={item.hsn} onChange={(e) => handleChange(e, index)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addItem} 
                    className="inline-flex items-center px-4 py-2 border border-dashed border-blue-500 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> {/* Make sure Plus is imported */}
                    Add More Item
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div>
                      <label htmlFor="physicalWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Physical Weight <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input type="number" id="physicalWeight" name="physicalWeight" value={form.physicalWeight} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400">KG</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Length <span className="text-red-500">*</span></label>
                       <div className="relative">
                        <input type="number" id="length" name="length" value={form.length} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400">CM</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="breadth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Breadth <span className="text-red-500">*</span></label>
                       <div className="relative">
                        <input type="number" id="breadth" name="breadth" value={form.breadth} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400">CM</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height <span className="text-red-500">*</span></label>
                       <div className="relative">
                        <input type="number" id="height" name="height" value={form.height} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10" />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 dark:text-gray-400">CM</span>
                      </div>
                    </div>
                </div>
            </section>
 
            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">
                  4
                </span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Pickup Location</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Search Pickup Location"
                  value={form.pickupLocation}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, pickupLocation: e.target.value }))
                  }}
                  onFocus={handleWarehouseFromDB}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer px-4 py-2 font-semibold transition-colors duration-200 shadow-sm"
                >
                  Add Warehouse
                </button>
              </div>

              <div className="mt-2">
                {warehouses.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm p-2">No warehouses found.</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                    {(form.pickupLocation
                      ? warehouses.filter(
                          (w) =>
                            w.warehouseName.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                            w.city.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                            w.state.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                            w.pincode.includes(form.pickupLocation),
                        )
                      : warehouses
                    )
                      .slice(0, 2)
                      .map((w) => (
                        <div
                          key={w.id}
                          className="p-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-b border-gray-300 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
                          onClick={() => setForm((f) => ({ ...f, pickupLocation: w.warehouseName }))}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{w.warehouseName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {w.address1}, {w.city}, {w.state} - {w.pincode}
                          </div>
                        </div>
                      ))}
                    {warehouses.length > 2 && (
                      <details>
                        <summary className="p-2 text-indigo-700 dark:text-indigo-400 cursor-pointer select-none hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200">
                          Show more...
                        </summary>
                        {warehouses.slice(2).map((w) => (
                          <div
                            key={w.id}
                            className="p-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-b border-gray-300 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
                            onClick={() => setForm((f) => ({ ...f, pickupLocation: w.warehouseName }))}
                          >
                            <div className="font-semibold text-gray-900 dark:text-white">{w.warehouseName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {w.address1}, {w.city}, {w.state} - {w.pincode}
                            </div>
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                )}
              </div>
            </section>
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer px-8 py-2 font-semibold transition-colors duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 transition-colors duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">My Orders</h2>
            {loading ? (
              <div className="flex justify-center items-center py-8 text-gray-600 dark:text-gray-300">
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Loading orders...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-300 dark:border-gray-600 transition-colors duration-200">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-600">Order ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-600">Product Details</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-600">Total Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-600">Total Value</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-600">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.length === 0 && (
                       <tr>
                         <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                           No orders found.
                         </td>
                       </tr>
                    )}
                    {orders.map((o: Order) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="p-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-xs font-mono">{o.orderId}</td>
                        <td className="p-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 align-top text-xs">
                          {o.items && o.items.length > 0 ? (
                            o.items.map((item: OrderItem, index: number) => (
                              <div key={index} className={index > 0 ? "mt-1 pt-1 border-t border-gray-200 dark:border-gray-700" : ""}>
                                {item.productName} ({item.quantity}x) - ₹{item.orderValue}
                                {item.hsn && <span className="text-gray-500 dark:text-gray-400 text-[10px] block">HSN: {item.hsn}</span>}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">No items</span>
                          )}
                        </td>
                        <td className="p-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-center text-sm">
                          {o.items ? o.items.reduce((sum: number, item: OrderItem) => sum + Number(item.quantity || 0), 0) : 0}
                        </td>
                        <td className="p-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-right text-sm">
                          ₹{o.items ? (o.items.reduce((sum: number, item: OrderItem) => sum + (Number(item.orderValue || 0) * Number(item.quantity || 0)), 0)).toFixed(2) : '0.00'}
                        </td>
                        <td className="p-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              o.status === "delivered" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                              "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {o.status ? o.status.replace(/_/g, ' ').toUpperCase() : "PENDING"}
                          </span>
                        </td>
                        <td className="p-2 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-center text-sm">
                          {new Date(o.orderDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    </KycGuard>
    </>
  )
}
