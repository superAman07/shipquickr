'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Trash2, Search, Plus, Package, Home, ChevronRight, MoreHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrderTabs } from "./orderTabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface OrderItem {
  productName: string;
  quantity: number;
  orderValue: number;
  hsn?: string
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
  pickupLocation?: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
  warehouseId?: number | string;
  warehouse?: {
    warehouseName: string;
    warehouseCode: string;
  } | null;
}
const tabs = [
  { label: "All Orders", href: "/user/dashboard/bulk" },
  { label: "Unshipped", href: "/user/dashboard/unshipped" },
  { label: "Shipped", href: "/user/dashboard/shipped" },
  { label: "Cancelled", href: "/user/dashboard/cancel" },
];

const CancelledOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/orders/single-order?status=cancelled");
      const ordersWithItems = response.data.orders.map((order: any) => ({
        ...order,
        items: order.items || [],
      }));
      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load cancelled orders.");
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
    order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase())) || // Search within items
    order.mobile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusColor = (status: string) => {
    const baseColors = {
      unshipped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">      <main className="p-6">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex  flex-wrap items-center justify-between gap-4 mb-8">
            <div className="mt-2 flex flex-col flex-wrap items-start gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
              <h2 className="text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-100">Cancelled Orders</h2>
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
                <span className="font-medium truncate text-gray-700 dark:text-white">Cancelled Orders</span>
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
            <button type="button" onClick={() => { window.location.href = '/user/dashboard/single-order' }} className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white font-semibold transition dark:bg-blue-700 dark:hover:bg-blue-800">
              <Plus className="h-5 w-5" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="block lg:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-[calc(70vh-280px)] overflow-y-auto">
              <div className="space-y-3 p-4">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-1 break-all">{order.orderId}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)} ml-2`}>
                        Cancelled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3 text-sm">
                      <div className="col-span-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{order.customerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
                      </div>
                      <div className="col-span-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{order.paymentMode}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Pickup Address</div>
                        <div className="text-gray-800 dark:text-gray-100 leading-relaxed">
                          {order.warehouse?.warehouseName || "Not specified"}
                          {order.warehouse?.warehouseCode && ` (${order.warehouse.warehouseCode})`}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer Address</div>
                        <div className="text-gray-800 dark:text-gray-100 leading-relaxed">{order.address}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Product Details</div>
                      <div className="p-2 rounded-md bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {order.items.map((item: OrderItem, index: number) => (
                              <div key={index} className={index > 0 ? "pt-1 border-t border-gray-300 dark:border-gray-600" : ""}>
                                <span className="font-medium text-gray-800 dark:text-gray-100">{item.productName}</span> (Qty: {item.quantity})
                                {item.hsn && <span className="text-gray-500 dark:text-gray-400 text-[10px] block">HSN: {item.hsn}</span>}
                              </div>
                            ))}
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600">
                              {(order.length && order.breadth && order.height) ? `Dims: ${order.length}x${order.breadth}x${order.height}cm | ` : ""}
                              {order.physicalWeight ? `Wt: ${order.physicalWeight}Kg` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <button onClick={() => handleCloneOrder(order.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition dark:text-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800">
                          <Copy className="h-3 w-3" /> Clone
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition dark:text-red-300 dark:bg-red-900 dark:hover:bg-red-800">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="py-12 text-center">
                    <Package className="h-12 w-12 mb-4 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No orders found</h3>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile Pagination */}
            <div className="px-4 py-3 border-t bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold">{filteredOrders.length}</span> orders
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePreviousPage} className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" disabled={currentPage === 1}>
                    Previous
                  </button>
                  <span className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    {currentPage}
                  </span>
                  <button onClick={handleNextPage} className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" disabled={currentPage === totalPages || filteredOrders.length === 0}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block overflow-hidden shadow-2xl bg-white dark:bg-gray-900 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-indigo-100 dark:bg-indigo-950">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Order ID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider min-w-[250px]">Product Details</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Address</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Pickup Location</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors duration-150">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {order.orderId}
                    </td>
                    <td className="px-3 py-2 text-xs align-top break-words min-w-[250px]">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-1">
                          {order.items.map((item: OrderItem, index: number) => (
                            <div key={index} className={index > 0 ? "pt-1 border-t border-gray-200 dark:border-gray-700" : ""}>
                              <span className="font-medium">{item.productName}</span> ({item.quantity}x)
                              {item.hsn && <span className="text-gray-500 dark:text-gray-400 text-[10px] block">HSN: {item.hsn}</span>}
                            </div>
                          ))}
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600">
                            {(order.length && order.breadth && order.height)
                              ? `Dims: ${order.length}x${order.breadth}x${order.height}cm | `
                              : ""}
                            {order.physicalWeight
                              ? `Wt: ${order.physicalWeight}Kg`
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No items</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {order.paymentMode}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
                    </td>
                    <td className="px-3 py-2 text-sm max-w-xs truncate">
                      {order.address}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div>{order.warehouse?.warehouseName || "-"}</div>
                      {order.warehouse?.warehouseCode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ({order.warehouse.warehouseCode})
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(order.status)}`}>
                        Cancelled
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center gap-3 md:hidden">
                        <button
                          type="button"
                          onClick={() => handleCloneOrder(order.id)}
                          className="p-2 rounded-full border border-transparent text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition dark:text-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-700"
                          title="Clone Order"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 rounded-full border border-transparent text-red-600 hover:bg-red-100 hover:border-red-400 transition dark:text-red-300 dark:hover:bg-red-900 dark:hover:border-red-700"
                          title="Delete Order"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="hidden md:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCloneOrder(order.id)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Clone Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold">{filteredOrders.length}</span> orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                disabled={currentPage === totalPages || filteredOrders.length === 0}
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

export default CancelledOrdersPage;