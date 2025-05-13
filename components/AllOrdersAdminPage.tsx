"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import OrderDetailsModal from "./OrderDetailsModal";
import {
  ChevronRight,
  Home,
  Package,
  Search as SearchIcon,
  Copy,
  Truck,
  Trash2,
  XCircle,  
  Eye,  
  Plus, 
  ListFilter, 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  customerName: string;
  address: string; 
  city: string;
  state: string;
  pincode: string;
  landmark?: string;  
  mobile: string;  
  email?: string;

  items: OrderItem[];
  status: "all" | "unshipped" | "shipped" | "cancelled" | "rto" | "delivered" | "pending_manifest" | "manifested" | "in_transit" | "out_for_delivery" | "undelivered" | "rto_intransit" | "rto_delivered" | "lost_shipment";
  paymentMode: string;
  awbNumber?: string;
  courierName?: string;
  totalAmount: number;
  user?: {  
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  pickupLocation?: string;
}

type TabValue = "all" | "unshipped" | "shipped" | "cancelled";

const TABS: { label: string; value: TabValue }[] = [
  { label: "All Orders", value: "all" },
  { label: "Unshipped", value: "unshipped" },
  { label: "Shipped", value: "shipped" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AllOrdersAdminPage() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: activeTab === "all" ? undefined : activeTab,
        search: searchTerm,
      };
      
      const response = await axios.get("/api/admin/orders", { params });
      setOrders(response.data.orders || []);
      setTotalOrders(response.data.totalOrders || 0);
    } catch (error) {
      console.error("Error fetching orders for admin:", error);
      toast.error("Failed to load orders.");
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, itemsPerPage, activeTab, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleTabChange = (tabValue: TabValue) => {
    setActiveTab(tabValue);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const getStatusColor = (status: Order["status"]) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "shipped" || statusLower === "delivered" || statusLower === "manifested") return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200";
    if (statusLower === "unshipped" || statusLower === "pending_manifest") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200";
    if (statusLower === "cancelled") return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200";
    if (statusLower === "rto" || statusLower === "rto_intransit" || statusLower === "rto_delivered") return "bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200";
    if (statusLower === "in_transit" || statusLower === "out_for_delivery") return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200";
    if (statusLower === "undelivered" || statusLower === "lost_shipment") return "bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const formatAddress = (order: Pick<Order, 'address' | 'city' | 'state' | 'pincode' | 'landmark'>) => {
    if (!order.address && !order.city && !order.state && !order.pincode) return "N/A";
    
    const addressParts = [];
    if (order.address) addressParts.push(order.address);
    if (order.city) addressParts.push(order.city);
    if (order.state) addressParts.push(order.state);
    if (order.landmark) addressParts.push(order.landmark);  

    let formattedAddress = addressParts.join(', ');

    if (order.pincode) {
      formattedAddress = formattedAddress ? `${formattedAddress} - ${order.pincode}` : order.pincode;
    }
    
    return formattedAddress.trim().replace(/^,|,$/g, '') || "N/A";
  };

  const handleCloneOrder = (orderId: string) => {
    router.push(`/admin/dashboard/clone-order/${orderId}`);
  };

  const handleShipOrder = (orderId: string) => { 
    router.push(`/admin/dashboard/ship-order/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This action is for admin only.")) return;
    try { 
      await axios.delete(`/api/admin/orders/${orderId}`);
      toast.success("Order deleted successfully by admin.");
      fetchOrders(); 
    } catch (error: any) {
      console.error("Error deleting order by admin:", error);
      toast.error(error.response?.data?.error || "Failed to delete order.");
    }
  };

  const currentBreadcrumbLabel = TABS.find(tab => tab.value === activeTab)?.label || "All Orders";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 dark:text-amber-50">
                <ListFilter className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  All User Orders
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Admin Dashboard
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium">{currentBreadcrumbLabel}</span>
              </div>
            </div>
             <Link href="/admin/dashboard/single-order">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Order (Admin)
                </Button>
              </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm focus:outline-none
                  ${activeTab === tab.value
                    ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20 h-9 text-sm">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(num => (
                    <SelectItem key={num} value={num.toString()} className="text-sm">{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
            </div>
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search orders (ID, Name, AWB)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 h-9 text-sm w-full sm:w-64 rounded-md border dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {["S.No", "Order Date", "Order ID", "Customer Name", "Customer Address", "Status", "AWB No.", "Courier", "Actions"].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No matching records found.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Link href={`/admin/dashboard/order-details/${order.id}`}>{order.orderId}</Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{order.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{formatAddress(order)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{order.awbNumber || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{order.courierName || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(order)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 h-8 w-8 cursor-pointer">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Clone Order (Admin)" onClick={() => handleCloneOrder(order.id)} className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-500 h-8 w-8 cursor-pointer">
                            <Copy className="h-4 w-4" />
                          </Button>
                          {(order.status === "unshipped" || order.status === "pending_manifest") && (
                            <Button variant="ghost" size="icon" title="Ship Order (Admin)" onClick={() => handleShipOrder(order.id)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500 h-8 w-8 cursor-pointer">
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Delete Order (Admin)" onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 h-8 w-8 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} results
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
      />
    </div>
  );
}