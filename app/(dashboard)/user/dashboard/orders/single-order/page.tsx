"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";

const initialForm = {
  customerName: "",
  mobile: "",
  email: "",
  address: "",
  landmark: "",
  pincode: "",
  state: "",
  city: "",
  orderId: "",
  orderDate: "",
  paymentMode: "",
  productName: "",
  category: "",
  quantity: 1,
  orderValue: "",
  hsn: "",
  codAmount: "",
  physicalWeight: "",
  length: "",
  breadth: "",
  height: "",
  pickupLocation: "",
};

export default function SingleOrderPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  useEffect(() => {
    setLoading(true);
    axios.get("/api/user/orders/single-order")
      .then(res => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  }, [submitting]);
 
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/user/orders/single-order", {
        ...form,
        quantity: Number(form.quantity),
        orderValue: Number(form.orderValue),
        codAmount: Number(form.codAmount),
        physicalWeight: Number(form.physicalWeight),
        length: Number(form.length),
        breadth: Number(form.breadth),
        height: Number(form.height),
        orderDate: new Date(form.orderDate),
      });
      setForm(initialForm);
    } catch (err) {
      alert("Failed to add order");
    } finally {
      setSubmitting(false);
    }
  };
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    setForm(f => ({ ...f, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0].Status === "Success") {
          setForm(f => ({
            ...f,
            state: data[0].PostOffice[0].State,
            city: data[0].PostOffice[0].District
          }));
        }
      } catch {}
    }
  };
  const handleWarehouseFromDB = async ()=>{
    try{
      const response = await axios.get("/api/user/warehouses")
      const data = response.data.warehouses || [];
      setWarehouses(data);
    }catch{}
  }

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 sm:p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Add Single Order</h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Consignee Details */}
          <section>
            <div className="flex items-center mb-4">
              <span className="bg-indigo-900 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2">1</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Consignee Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="border p-2 rounded" placeholder="Customer Full Name *" required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="Mobile No. *" required value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="Email ID" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </section>

          {/* Customer Address */}
          <section>
            <div className="flex items-center mb-4">
              <span className="bg-indigo-900 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2">2</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Customer Address</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input className="border p-2 rounded col-span-2" placeholder="Complete Address *" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="Pincode *" required value={form.pincode} onChange={handlePincodeChange} />
              <input className="border p-2 rounded" placeholder="State *" readOnly tabIndex={-1} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="City *" readOnly tabIndex={-1} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              <input className="border p-2 rounded col-span-2" placeholder="Famous Landmark" value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} />
            </div>
          </section>

          {/* Order Details */}
          <section>
            <div className="flex items-center mb-4">
              <span className="bg-indigo-900 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2">3</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Order Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="border p-2 rounded" placeholder="Order Id *" required value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} />
              <button
                type="button"
                className="text-blue-600 text-xs underline ml-2"
                onClick={() => setForm(f => ({ ...f, orderId: `ORD-${Date.now()}` }))}
                >
                Auto Generate ID
              </button>
              <input className="border p-2 rounded" type="date" placeholder="Order Date *" required value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} />
              <label htmlFor="paymentMode" className="sr-only">Payment Mode</label>
              <select id="paymentMode" className="border p-2 rounded" required value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                <option value="">Payment Mode *</option>
                <option value="COD">COD</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
              <input className="border p-2 rounded" placeholder="Product Name *" required value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
              <label htmlFor="category" className="sr-only">Category</label>
              <select
                id="category"
                className="border p-2 rounded"
                required
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                <option value="">Select</option>
                <option value="Accessories">Accessories</option>
                <option value="Fashion & Clothing">Fashion & Clothing</option>
                <option value="Book & Stationary">Book & Stationary</option>
                <option value="Electronics">Electronics</option>
                <option value="FMCG">FMCG</option>
                <option value="Footwear">Footwear</option>
                <option value="Toys">Toys</option>
                <option value="Sports Equipment">Sports Equipment</option>
                <option value="Others">Others</option>
                <option value="Wellness">Wellness</option>
                <option value="Medicines">Medicines</option>
                </select>
              <input className="border p-2 rounded" type="number" min={1} placeholder="Quantity *" required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              <input className="border p-2 rounded" type="number" min={0} placeholder="Order Value *" required value={form.orderValue} onChange={e => setForm(f => ({ ...f, orderValue: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="HSN" value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))} />
              {form.paymentMode === "COD" && (
                <input
                    className="border p-2 rounded"
                    type="number"
                    min={0}
                    placeholder="COD Amount (in Rs.) *"
                    required
                    value={form.codAmount}
                    onChange={e => setForm(f => ({ ...f, codAmount: e.target.value }))}
                />
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="flex">
                <input className="border p-2 rounded-l w-full" type="number" min={0} step="0.01" placeholder="Physical Weight *" required value={form.physicalWeight} onChange={e => setForm(f => ({ ...f, physicalWeight: e.target.value }))} />
                <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 rounded-r px-2 flex items-center">KG</span>
              </div>
              <div className="flex">
                <input className="border p-2 rounded-l w-full" type="number" min={0} step="0.01" placeholder="Length *" required value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} />
                <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 rounded-r px-2 flex items-center">CM</span>
              </div>
              <div className="flex">
                <input className="border p-2 rounded-l w-full" type="number" min={0} step="0.01" placeholder="Breadth *" required value={form.breadth} onChange={e => setForm(f => ({ ...f, breadth: e.target.value }))} />
                <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 rounded-r px-2 flex items-center">CM</span>
              </div>
              <div className="flex">
                <input className="border p-2 rounded-l w-full" type="number" min={0} step="0.01" placeholder="Height *" required value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
                <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 rounded-r px-2 flex items-center">CM</span>
              </div>
            </div>
          </section>

          {/* Pickup Location */} 
          <section>
            <div className="flex items-center mb-4">
              <span className="bg-indigo-900 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2">4</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Pickup Location</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Search Pickup Location"
                value={form.pickupLocation}
                onChange={e => {
                  setForm(f => ({ ...f, pickupLocation: e.target.value }));
                  // Optionally filter warehouses here
                }}
                onFocus={handleWarehouseFromDB}
              />
              <button
                type="button"
                onClick={() => setShowWarehouseModal(true)}
                className="bg-indigo-900 text-white rounded px-4 py-2 font-semibold"
              >
                Add Warehouse
              </button>
            </div>
 
            <div className="mt-2">
              {warehouses.length === 0 ? (
                <div className="text-gray-500 text-sm">No warehouses found.</div>
              ) : (
                <div className="max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800">
                  {(form.pickupLocation
                    ? warehouses.filter(w =>
                        w.warehouseName.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                        w.city.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                        w.state.toLowerCase().includes(form.pickupLocation.toLowerCase()) ||
                        w.pincode.includes(form.pickupLocation)
                      )
                    : warehouses
                  )
                    .slice(0, 2)
                    .map(w => (
                      <div
                        key={w.id}
                        className="p-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 border-b last:border-b-0"
                        onClick={() => setForm(f => ({ ...f, pickupLocation: w.warehouseName }))}
                      >
                        <div className="font-semibold">{w.warehouseName}</div>
                        <div className="text-xs text-gray-500">{w.address1}, {w.city}, {w.state} - {w.pincode}</div>
                      </div>
                    ))} 
                  {warehouses.length > 2 && (
                    <details>
                      <summary className="p-2 text-indigo-700 cursor-pointer select-none">Show more...</summary>
                      {warehouses.slice(2).map(w => (
                        <div
                          key={w.id}
                          className="p-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 border-b last:border-b-0"
                          onClick={() => setForm(f => ({ ...f, pickupLocation: w.warehouseName }))}
                        >
                          <div className="font-semibold">{w.warehouseName}</div>
                          <div className="text-xs text-gray-500">{w.address1}, {w.city}, {w.state} - {w.pincode}</div>
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              )}
            </div>
          </section>
          <div className="flex justify-center mt-8">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-8 py-2 font-semibold" disabled={submitting}>
              {submitting ? "Adding..." : "Add Order"}
            </button>
          </div>
        </form>
        <AddWarehouseModal
          open={showWarehouseModal}
          onClose={() => setShowWarehouseModal(false)}
          onSuccess={() => { 
          }}
        />
      </div>
      
      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 sm:p-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">My Orders</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-2 border">Order ID</th>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">Value</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id || i}>
                    <td className="p-2 border">{o.orderId}</td>
                    <td className="p-2 border">{o.productName}</td>
                    <td className="p-2 border">{o.quantity}</td>
                    <td className="p-2 border">₹{o.orderValue}</td>
                    <td className="p-2 border">{o.status}</td>
                    <td className="p-2 border">{new Date(o.orderDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-gray-500 text-center py-4">No orders yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
}