"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import AddWarehouseModal from "@/components/AddWarehouse";
import KycGuard from "@/components/isKycDone";
import { toast } from "react-toastify";

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

export default function CloneOrderPage({ orderId }: { orderId: string }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`/api/user/orders/single-order/${orderId}`)
      .then(res => {
        const { id, orderId, orderDate, status, ...rest } = res.data.order;
        setForm({
          ...initialForm,
          ...rest,
          orderId: "",
          orderDate: new Date().toISOString().slice(0, 10),
          status: "unshipped",
        });
      })
      .finally(() => setLoading(false));
  }, [orderId]);

   
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)
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
      })
      setForm(initialForm)
      toast.success("Order cloned successfully!");
      window.location.href = "/user/dashboard/bulk";
    } catch (err) {
        toast.error("Failed to clone order. Please try again.");
    } finally {
      setSubmitting(false)
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

  const handleWarehouseFromDB = async () => {
    try {
      const response = await axios.get("/api/user/warehouses")
      const data = response.data.warehouses || []
      setWarehouses(data) 
    } catch {}
  }
  if (loading) return <div>Loading...</div>;

  return (
    <KycGuard>
      <div className="max-w-6xl mx-auto p-2 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 mb-8 transition-colors duration-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Clone Order</h2>
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
 
            <section className="transition-all duration-200">
              <div className="flex items-center mb-4">
                <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold mr-2 shadow-sm">
                  3
                </span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">Order Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    placeholder="Order Id *"
                    required
                    value={form.orderId}
                    onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-600 dark:text-indigo-400 text-xs underline"
                    onClick={() => setForm((f) => ({ ...f, orderId: `ORD-${Date.now()}` }))}
                  >
                    Auto Generate ID
                  </button>
                </div>
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  type="date"
                  placeholder="Order Date *"
                  required
                  value={form.orderDate}
                  onChange={(e) => setForm((f) => ({ ...f, orderDate: e.target.value }))}
                />
                <label htmlFor="paymentMode" className="sr-only">
                  Payment Mode
                </label>
                <select
                  id="paymentMode"
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  required
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                  aria-label="Payment Mode"
                >
                  <option value="">Payment Mode *</option>
                  <option value="COD">COD</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="Product Name *"
                  required
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                />
                <label htmlFor="category" className="sr-only">
                  Product Category
                </label>
                <select
                  id="category"
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  aria-label="Product Category"
                >
                  <option value="">Category</option>
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
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  type="number"
                  min={1}
                  placeholder="Quantity *"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  type="number"
                  min={0}
                  placeholder="Order Value *"
                  required
                  value={form.orderValue}
                  onChange={(e) => setForm((f) => ({ ...f, orderValue: e.target.value }))}
                />
                <input
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                  placeholder="HSN"
                  value={form.hsn}
                  onChange={(e) => setForm((f) => ({ ...f, hsn: e.target.value }))}
                />
                {form.paymentMode === "COD" && (
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    type="number"
                    min={0}
                    placeholder="COD Amount (in Rs.) *"
                    required
                    value={form.codAmount}
                    onChange={(e) => setForm((f) => ({ ...f, codAmount: e.target.value }))}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="flex">
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-l-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Physical Weight *"
                    required
                    value={form.physicalWeight}
                    onChange={(e) => setForm((f) => ({ ...f, physicalWeight: e.target.value }))}
                  />
                  <span className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-3 flex items-center text-gray-700 dark:text-gray-200 transition-colors duration-200">
                    KG
                  </span>
                </div>
                <div className="flex">
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-l-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Length *"
                    required
                    value={form.length}
                    onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))}
                  />
                  <span className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-3 flex items-center text-gray-700 dark:text-gray-200 transition-colors duration-200">
                    CM
                  </span>
                </div>
                <div className="flex">
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-l-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Breadth *"
                    required
                    value={form.breadth}
                    onChange={(e) => setForm((f) => ({ ...f, breadth: e.target.value }))}
                  />
                  <span className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-3 flex items-center text-gray-700 dark:text-gray-200 transition-colors duration-200">
                    CM
                  </span>
                </div>
                <div className="flex">
                  <input
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-l-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Height *"
                    required
                    value={form.height}
                    onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  />
                  <span className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-3 flex items-center text-gray-700 dark:text-gray-200 transition-colors duration-200">
                    CM
                  </span>
                </div>
              </div>
            </section>

            {/* Pickup Location */}
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
                    // Optionally filter warehouses here
                  }}
                  onFocus={handleWarehouseFromDB}
                />
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 font-semibold transition-colors duration-200 shadow-sm"
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
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-8 py-2 font-semibold transition-colors duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <AddWarehouseModal
        open={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        onSuccess={() => {}}
      />
    </KycGuard>
  );
}