"use client";
import { useEffect, useState } from "react";
import type React from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";
import { toast } from "react-toastify";
import { Plus, Trash2, Loader2, Home, ChevronRight, FileCheck } from "lucide-react"; // Added Loader2, Home, etc.
import Link from "next/link";  

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
  targetUserId: string | null;  
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
  targetUserId: null,  
};
 
interface CloneOrderClientProps {
  orderIdToClone: string;  
}

export default function CloneOrderPageClient({ orderIdToClone }: CloneOrderClientProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);  
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    setLoading(true);
    axios.get(`/api/admin/orders/${orderIdToClone}`)  
      .then(res => {
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

        const itemsForForm = (fetchedItems && fetchedItems.length > 0)
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
          orderId: "",  
          orderDate: new Date().toISOString().slice(0, 10),  
          targetUserId: userId,
          warehouseId: originalWarehouseId || null,
          pickupLocation: originalPickupLocation || "",
        });
        setWarehouseSearch(originalPickupLocation || "");  
      })
      .catch(error => {
        console.error("Error fetching order to clone:", error);
        toast.error(error.response?.data?.error || "Failed to load order data for cloning.");
      })
      .finally(() => setLoading(false));
  }, [orderIdToClone]);

  useEffect(() => {
    if (form.targetUserId) {
      handleWarehouseFromDB(form.targetUserId);
    } else {
      setWarehouses([]);  
    }
  }, [form.targetUserId]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    itemIndex?: number
  ) => {
    const { name, value } = e.target;

    if (itemIndex !== undefined && name in initialItem) {
      setForm((prev) => {
        const newItems = [...prev.items];
        if (newItems[itemIndex]) {
            newItems[itemIndex] = { ...newItems[itemIndex], [name]: value, };
        }
        return { ...prev, items: newItems };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value, }));
    }
  };

  const addItem = () =>  
  const removeItem = (index: number) =>  
  const generateOrderId = () =>  
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... same as before ... */ };

  const handleWarehouseFromDB = async (userIdForWarehouses: string | null) => {
    if (!userIdForWarehouses) {
      setWarehouses([]);
      return;
    }
    try { 
      const response = await axios.get(`/api/admin/warehouses?userId=${userIdForWarehouses}`);
      const data = response.data.warehouses || [];
      setWarehouses(data);
      if (data.length === 0) {
        toast.info("No warehouses found for the assigned user.");
      }
    } catch (error){
        console.error("Error fetching warehouses:", error);
        toast.error("Could not load warehouses for the assigned user.");
        setWarehouses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Cloning order...");

    if (!form.targetUserId) {
      toast.update(toastId, { render: "Target user not identified. Cannot clone.", type: "error", isLoading: false, autoClose: 5000 });
      setSubmitting(false);
      return;
    }
    
    if (!form.orderId || !form.orderDate || !form.paymentMode || !form.warehouseId || !form.customerName || !form.mobile || !form.address || !form.pincode || !form.state || !form.city || !form.physicalWeight || !form.length || !form.breadth || !form.height) {
      toast.update(toastId, { render: "Please fill all required fields marked with *", type: "error", isLoading: false, autoClose: 5000 });
      setSubmitting(false);
      return;
    }
    if (form.items.some(item => !item.productName || !item.category || !item.quantity || !item.orderValue)) {
       toast.update(toastId, { render: "Please fill all required fields for each item.", type: "error", isLoading: false, autoClose: 5000 });
       setSubmitting(false);
       return;
    }
    if (form.paymentMode === "COD" && (!form.codAmount || parseFloat(String(form.codAmount)) <= 0)) {
        toast.update(toastId, { render: "Please enter a valid COD amount.", type: "error", isLoading: false, autoClose: 5000 });
        setSubmitting(false);
        return;
    }

    const apiData = {
      ...form,
      userId: form.targetUserId,  
      items: form.items.map(item => ({
        ...item,
        quantity: parseInt(String(item.quantity), 10) || 1,
        orderValue: parseFloat(String(item.orderValue)) || 0,
      })),
      warehouseId: form.warehouseId,  
      pickupLocation: warehouses.find(w => w.id === form.warehouseId)?.warehouseName || form.pickupLocation, // Send warehouse name
      physicalWeight: parseFloat(String(form.physicalWeight)) || 0,
      length: parseFloat(String(form.length)) || 0,
      breadth: parseFloat(String(form.breadth)) || 0,
      height: parseFloat(String(form.height)) || 0,
      codAmount: form.paymentMode === "COD" ? parseFloat(String(form.codAmount)) || 0 : undefined,
      orderDate: new Date(form.orderDate).toISOString(),
    };

    delete (apiData as any).targetUserId;  

    try {
      
      await axios.post("/api/admin/orders/single-order", apiData, {
         headers: { "Content-Type": "application/json" },
      });
      toast.update(toastId, { render: "Order cloned successfully!", type: "success", isLoading: false, autoClose: 5000 });
      setForm(initialForm); 
      
      setTimeout(() => {
          window.location.href = "/admin/dashboard/all-orders";
      }, 1500);
    } catch (err: any) {
        console.error("Failed to clone order:", err);
        const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred";
        toast.update(toastId, { render: `Failed to clone order: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="ml-4 text-lg">Loading order details to clone...</p>
      </div>
    );
  }
  return ( 
    <div>
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center justify-start gap-2 dark:text-amber-50">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  Clone Order (Admin)
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300 transition-colors min-w-0 shrink-0">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> <span className="truncate">Admin Dashboard</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <Link href="/admin/dashboard/all-orders" className="hover:text-gray-300 transition-colors truncate">All Orders</Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium truncate">Clone Order</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-2 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 mb-8 transition-colors duration-200">
          {form.targetUserId && (  
            <section className="mb-8 p-4 border border-indigo-200 dark:border-indigo-700 rounded-md bg-indigo-50 dark:bg-indigo-900/30">
              <h3 className="text-md font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                Cloning Order For User:
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                User ID: {form.targetUserId}
              </p>
            </section>
          )}

          
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">1</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Consignee Details</span>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Customer Full Name *" required value={form.customerName} onChange={handleChange} name="customerName"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Mobile No. *" required type="tel" value={form.mobile} onChange={handleChange} name="mobile"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Email ID" type="email" value={form.email} onChange={handleChange} name="email"
                />
              </div>
            </section>

            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">2</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Customer Address</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md col-span-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Complete Address *" required value={form.address} onChange={handleChange} name="address"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Pincode *" required maxLength={6} value={form.pincode} onChange={handlePincodeChange} name="pincode"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200 cursor-not-allowed"
                  placeholder="State *" readOnly tabIndex={-1} value={form.state} onChange={handleChange} name="state"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200 cursor-not-allowed"
                  placeholder="City *" readOnly tabIndex={-1} value={form.city} onChange={handleChange} name="city"
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md col-span-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Famous Landmark" value={form.landmark} onChange={handleChange} name="landmark"
                />
              </div>
            </section>

            <section className="transition-all duration-200">
                <div className="flex items-center mb-4">
                    <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">3</span>
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">Order Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Order Id <span className="text-red-500">*</span></label>
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
                            <option value="COD">COD</option>
                            <option value="Prepaid">Prepaid</option>
                        </select>
                    </div>
                    {form.paymentMode === "COD" && (
                        <div className="md:col-start-3">
                            <label htmlFor="codAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">COD Amount (₹) <span className="text-red-500">*</span></label>
                            <input
                                type="number" id="codAmount" name="codAmount" value={form.codAmount} onChange={handleChange} required={form.paymentMode === 'COD'} min="0" step="0.01"
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
                        <button type="button" onClick={() => removeItem(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" aria-label="Remove Item">
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
                            <option value="Accessories">Accessories</option>
                            <option value="Fashion & Clothing">Fashion & Clothing</option>
                            <option value="Others">Others</option>
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
                  <button type="button" onClick={addItem} className="inline-flex items-center px-4 py-2 border border-dashed border-blue-500 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Add More Item
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
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">4</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Pickup Location <span className="text-red-500">*</span></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Search or Select Pickup Location" required
                  value={warehouseSearch}  
                  onChange={(e) => {
                      setWarehouseSearch(e.target.value);
                      
                      const selectedW = warehouses.find(w => w.id === form.warehouseId);
                      if (selectedW && selectedW.warehouseName !== e.target.value) {
                          setForm(f => ({ ...f, warehouseId: null, pickupLocation: "" }));
                      }
                  }}
                  onFocus={() => handleWarehouseFromDB(form.targetUserId)} // Fetch on focus if targetUserId is set
                  name="pickupLocationDisplay"
                />
                <button type="button" onClick={() => setShowWarehouseModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 font-semibold transition-colors duration-200 shadow-sm">
                  Add New Warehouse
                </button>
              </div>
              {form.warehouseId && (  
                <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Selected: {warehouses.find(w => w.id === form.warehouseId)?.warehouseName || form.pickupLocation}
                </div>
              )}
              <div className="mt-2">
                {warehouses.length === 0 && form.targetUserId ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm p-2">No warehouses found for the assigned user. Add one or select a different user.</div>
                ) : (
                  !form.targetUserId && <div className="text-gray-500 dark:text-gray-400 text-sm p-2">Original order user not identified.</div>
                )}
                { warehouses.length > 0 && warehouseSearch && !form.warehouseId && ( // Show search results only if searching and no warehouse is selected yet
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                    {warehouses
                      .filter(w =>
                          w.warehouseName.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
                          w.city.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
                          w.pincode.includes(warehouseSearch)
                      )
                      .slice(0, 5)
                      .map((w) => (
                        <div
                          key={w.id}
                          className="p-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-b border-gray-300 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
                          onClick={() => {
                              setForm((f) => ({ ...f, warehouseId: w.id, pickupLocation: w.warehouseName }));
                              setWarehouseSearch(w.warehouseName);  
                          }}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{w.warehouseName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {w.address1}, {w.city}, {w.state} - {w.pincode}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>

            <div className="flex justify-center mt-8">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-8 py-2 font-semibold transition-colors duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed" disabled={submitting || loading || !form.targetUserId}>
                {submitting ? "Cloning..." : "Clone Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <AddWarehouseModal
        open={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        onSuccess={() => handleWarehouseFromDB(form.targetUserId)} 
      />
    </div>
  );
}