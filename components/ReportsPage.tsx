'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Trash2, Search, Plus, Package, Home, ChevronRight, Download } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrderTabs } from "@/components/orderTabs";

interface Order {
  id: string;
  orderId: string;
  orderDate: string;
  productName: string; 
  orderValue: number ;
  customerName: string;
  mobile: string;
  billableWeight?: number | string;
  ageing?: number | string;
  attempts?: number | string;
  shippingDetails?: string;  
  remarks?: string;  
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
}

const tabs = [
    { label: "All-Shipments", status: undefined, href: "/user/dashboard/reports" },
    { label: "In-Transit", status: "in_transit" , href: "/user/dashboard/in-transit"},
    { label: "Out For Delivery", status: "out_for_delivery" , href: "/user/dashboard/out-for-delivery"},
    { label: "Unshipped", status: "unshipped", href: "/user/dashboard/unshipped-reports" },
    { label: "Delivered", status: "delivered" , href: "/user/dashboard/delivered"},
    { label: "Undelivered", status: "undelivered" , href: "/user/dashboard/undelivered"},
    { label: "RTO Intransit", status: "rto_intransit" , href: "/user/dashboard/rto-intransit"},
    { label: "RTO Delivered", status: "rto_delivered" , href: "/user/dashboard/rto-delivered"},
    { label: "Lost Shipment", status: "lost_shipment" , href: "/user/dashboard/lost-shipment"},
  ];

const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const pathname = usePathname(); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 


  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = tabs[activeTab].status;
      const url = status
        ? `/api/user/orders/single-order?status=${status}`
        : `/api/user/orders/single-order`;
      const response = await axios.get(url);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneOrder = (orderId: string) => {
    window.location.href = `/user/dashboard/clone-order/${orderId}`;
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
        await axios.delete(`/api/user/orders/single-order/${orderId}`);
        setOrders(orders.filter(order => order.id !== orderId));
        toast.success(`Order ${orderId} deleted successfully`);
    } catch (error) {
        toast.error("Failed to delete order. Please try again.");
    }
  };

  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.mobile.toLowerCase().includes(searchTerm.toLowerCase()) 
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusColor = (status: string) => {
    const baseColors = {
      unshipped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      undelivered: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      rto_intransit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      rto_delivered: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      lost_shipment: 'bg-gray-400 text-white dark:bg-gray-700 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const statusKey = status.toLowerCase() as keyof typeof baseColors;
    return baseColors[statusKey] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse space-y-4 rounded-lg p-6 bg-white dark:bg-gray-800">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-8 gap-4">
              {[...Array(8)].map((_, j) => (
                <div
                  key={j}
                  className="h-10 rounded bg-gray-200 dark:bg-gray-700"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function downloadCSV(orders: Order[]) {
    if (!orders.length) return;
    const headers = [
      "Order ID",
      "Product Details",
      "Order Value",
      "Customer Details",
      "Billable Weight",
      "Ageing",
      "Attempts",
      "Shipping Details",
      "Remarks",
      "Status"
    ];
    const rows = orders.map(order => [
      order.orderId,
      `${order.productName || ""}` +
      ((order.length && order.breadth && order.height)
        ? ` (${order.length}x${order.breadth}x${order.height})`
        : "") +
      (order.physicalWeight ? ` Weight : ${order.physicalWeight}Kg` : ""),
      order.orderValue,
      order.customerName,
      order.billableWeight,
      order.ageing,
      order.attempts,
      order.shippingDetails,
      order.remarks,
      order.status
    ]);
    const csvContent =
      [headers, ...rows]
        .map(e => e.map(x => `"${(x ?? "").toString().replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex  flex-wrap items-center justify-between gap-4 mb-8">
              <div className="mt-2 flex flex-col flex-wrap items-start gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <h2 className="text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-100">Reports</h2>
                <OrderTabs tabs={tabs} pathname={pathname} />
                <div className="flex items-center gap-1 min-w-0">
                  <Link
                    href="/user/dashboard"
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors min-w-0 shrink-0"
                  >
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-gray-400 dark:text-white" />
                    <span className="truncate text-gray-700 dark:text-white">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-gray-700 dark:text-white" />
                  <span className="font-medium truncate text-gray-700 dark:text-white">Reports</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 rounded-lg w-full sm:w-auto shadow-sm border transition
                    bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-400
                    dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800
                    focus:ring-2 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex flex-wrap items-center gap-4"> 
                <button
                  type="button"
                  onClick={() => downloadCSV(filteredOrders)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                  title="Download CSV"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-indigo-100 dark:bg-indigo-950">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Product Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Order Value</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Customer Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Billable Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Ageing</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Attempts</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Shipping Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs divide-gray-200 dark:divide-gray-800">
                    {paginatedOrders.map((order, idx) => (
                        <tr key={order.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors duration-150">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3">{order.orderId}</td>
                            <td className="px-4 py-3">
                                {order.productName}
                                {(order.length && order.breadth && order.height)
                                    ? ` (${order.length}x${order.breadth}x${order.height})`
                                    : ""}
                                {order.physicalWeight
                                    ? ` Weight : ${order.physicalWeight}Kg`
                                    : ""}
                            </td>
                            <td className="px-4 py-3">₹{order.orderValue?.toFixed(2) ?? "0.00"}</td>
                            <td className="px-4 py-3">
                                {order.customerName}
                                <br />
                                <span className="text-xs text-gray-500">{order.mobile}</span>
                            </td>
                            <td className="px-4 py-3">{order.billableWeight ?? "N/A"}</td>
                            <td className="px-4 py-3">{order.ageing ?? "0"}</td>
                            <td className="px-4 py-3">{order.attempts ?? "0"}</td>
                            <td className="px-4 py-3">{order.shippingDetails ?? "-"}</td>
                            <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shadow ${getStatusColor(order.status)} whitespace-nowrap`}>
                            {order.status === "unshipped" ? "Unshipped" : order.status.replace(/_/g, " ")}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center"> 
                                <div className="flex justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleCloneOrder(order.id)}
                                    className="p-2 rounded-full border border-transparent text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition dark:text-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-700"
                                    title="Clone Order"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center">
                <Package className="h-12 w-12 mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  No orders found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try creating a new order or adjusting your search.
                </p>
              </div>
            )}

            <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-bold">{filteredOrders.length}</span> orders
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;