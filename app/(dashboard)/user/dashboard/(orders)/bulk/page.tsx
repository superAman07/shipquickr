// 'use client'
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Copy, Trash2, Search, Plus, Package, Home, ChevronRight, Truck, MoreHorizontal, XCircle } from "lucide-react";
// import { toast } from "react-toastify";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { OrderTabs } from "@/components/orderTabs";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";

// interface OrderItem {
//   id?: number;
//   productName: string;
//   category: string;
//   quantity: number;
//   orderValue: number;
//   hsn: string;
// }

// interface Order {
//   id: string;
//   orderId: string;
//   orderDate: string;
//   items: OrderItem[];
//   paymentMode: string;
//   customerName: string;
//   mobile: string;
//   address: string;
//   pickupLocation?: string;
//   status: string;
//   length?: number | string;
//   breadth?: number | string;
//   height?: number | string;
//   physicalWeight?: number | string;
//   warehouseId?: number | string;
//   warehouse?: {
//     warehouseName: string;
//     warehouseCode: string;
//   } | null;
// }

// const tabs = [
//   { label: "All Orders", href: "/user/dashboard/bulk" },
//   { label: "Unshipped", href: "/user/dashboard/unshipped" },
//   { label: "Shipped", href: "/user/dashboard/shipped" },
//   { label: "Cancelled", href: "/user/dashboard/cancel" },
// ];

// const BulkOrdersPage: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");

//   const pathname = usePathname();


//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get("/api/user/orders/single-order");
//       const ordersWithItems = response.data.orders.map((order: any) => ({
//         ...order,
//         items: order.items || [],
//       }));
//       setOrders(ordersWithItems);
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//       toast.error("Failed to load orders.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCloneOrder = (orderId: string) => {
//     window.location.href = `/user/dashboard/clone-order/${orderId}`;
//   };

//   const handleDeleteOrder = async (orderId: string) => {
//     if (!window.confirm("Are you sure you want to delete this order?")) return;
//     try {
//       await axios.delete(`/api/user/orders/single-order/${orderId}`);
//       setOrders(orders.filter(order => order.id !== orderId));
//       toast.success(`Order ${orderId} deleted successfully`);
//     } catch (error) {
//       toast.error("Failed to delete order. Please try again.");
//     }
//   };

//   const handleCancelOrder = async (orderId: string) => {
//     if (!window.confirm("Are you sure you want to request cancellation for this shipped order? This cannot be undone.")) return;
//     const toastId = toast.loading("Requesting cancellation...");
//     try {
//       const response = await axios.post('/api/user/orders/cancel', { orderId });
//       if (response.data.success) {
//         toast.update(toastId, { render: "Order cancelled successfully. Shipping cost refunded.", type: "success", isLoading: false, autoClose: 5000 });
//         // Update the order status in the local state
//         setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
//       } else {
//         toast.update(toastId, { render: `Cancellation failed: ${response.data.error}`, type: "error", isLoading: false, autoClose: 5000 });
//       }
//     } catch (error: any) {
//       const errorMessage = error.response?.data?.error || "An unexpected error occurred.";
//       toast.update(toastId, { render: `Cancellation failed: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
//       console.error("Failed to cancel order:", error);
//     }
//   };

//   const filteredOrders = orders.filter(order =>
//     order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const getStatusColor = (status: string) => {
//     const baseColors = {
//       unshipped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
//       shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
//       delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
//       cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
//     };
//     const statusKey = status.toLowerCase() as keyof typeof baseColors;
//     return baseColors[statusKey] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
//   };

//   if (loading) {
//     return (
//       <div className="p-6 bg-gray-50 dark:bg-gray-900">
//         <div className="animate-pulse space-y-4 rounded-lg p-6 bg-white dark:bg-gray-800">
//           {[...Array(3)].map((_, i) => (
//             <div key={i} className="grid grid-cols-1 md:grid-cols-8 gap-4">
//               {[...Array(8)].map((_, j) => (
//                 <div
//                   key={j}
//                   className="h-10 rounded bg-gray-200 dark:bg-gray-700"
//                 ></div>
//               ))}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   const router = useRouter();
//   const handleShipOrder = (orderId: string) => {
//     router.push(`/user/dashboard/ship-order/${orderId}`);
//   };


//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
//       <main className="p-6">
//         <div className="max-w-full mx-auto">
//           <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
//             <div className="flex  flex-wrap items-center justify-between gap-4 mb-8">
//               <div className="mt-2 flex flex-col flex-wrap items-start gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
//                 <h2 className="text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-100">Bulk Orders</h2>
//                 <OrderTabs tabs={tabs} pathname={pathname} />
//                 <div className="flex items-center gap-1 min-w-0">
//                   <Link
//                     href="/user/dashboard"
//                     className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors min-w-0 shrink-0"
//                   >
//                     <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-gray-400 dark:text-white" />
//                     <span className="truncate text-gray-700 dark:text-white">Dashboard</span>
//                   </Link>
//                   <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-gray-700 dark:text-white" />
//                   <span className="font-medium truncate text-gray-700 dark:text-white">Bulk Orders</span>
//                 </div>
//               </div>
//             </div>
//             <div className="flex flex-wrap items-center gap-4">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search orders..."
//                   className="pl-10 pr-4 py-2 rounded-lg w-full sm:w-auto shadow-sm border transition
//                     bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-400
//                     dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800
//                     focus:ring-2 focus:border-blue-500"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//               </div>
//               <button type="button" onClick={() => { window.location.href = '/user/dashboard/single-order' }} className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white font-semibold transition dark:bg-blue-700 dark:hover:bg-blue-800">
//                 <Plus className="h-5 w-5" />
//                 <span>New Order</span>
//               </button>
//             </div>
//           </div>

//           <div className="shadow-2xl bg-white dark:bg-gray-900">
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800  ">
//                 <thead className="bg-indigo-100 dark:bg-indigo-950">
//                   <tr>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Date</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Order ID</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider min-w-[250px]">Product Details</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Payment</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Customer</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Address</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Pickup Location</th>
//                     <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ">Status</th>
//                     <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
//                   {filteredOrders.map((order) => (
//                     <tr key={order.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors duration-150">
//                       <td className="px-3 py-2   text-sm">
//                         {new Date(order.orderDate).toLocaleDateString()}
//                       </td>
//                       <td className="px-3 py-2   text-sm font-semibold text-blue-700 dark:text-blue-300">
//                         {order.orderId}
//                       </td>
//                       <td className="px-3 py-2 text-xs align-top break-words min-w-[150px] md:min-w-[250px]">
//                         {order.items && order.items.length > 0 ? (
//                           <div className="space-y-1">
//                             {order.items.map((item: OrderItem, index: number) => (
//                               <div key={index} className={index > 0 ? "pt-1 border-t border-gray-200 dark:border-gray-700" : ""}>
//                                 <span className="font-medium">{item.productName}</span> ({item.quantity}x)
//                                 {item.hsn && <span className="text-gray-500 dark:text-gray-400 text-[10px] block">HSN: {item.hsn}</span>}
//                               </div>
//                             ))}
//                             <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600">
//                               {(order.length && order.breadth && order.height)
//                                 ? `Dims: ${order.length}x${order.breadth}x${order.height} cm | `
//                                 : ""}
//                               {order.physicalWeight
//                                 ? `Wt: ${order.physicalWeight} Kg`
//                                 : ""}
//                             </div>
//                           </div>
//                         ) : (
//                           <span className="text-gray-400">No items</span>
//                         )}
//                       </td>
//                       <td className="px-3 text-center py-2   text-xs font-semibold">
//                         {order.paymentMode}
//                       </td>
//                       <td className="px-3 py-2  ">
//                         <div className="text-sm font-medium">{order.customerName}</div>
//                         <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
//                       </td>
//                       <td className="px-3 py-2 text-sm max-w-xs truncate">
//                         {order.address}
//                       </td>
//                       <td className="px-3 py-2   text-sm">
//                         <div>{order.warehouse?.warehouseName || "-"}</div>
//                         {order.warehouse?.warehouseCode && (
//                           <div className="text-xs text-gray-500 dark:text-gray-400">
//                             ({order.warehouse.warehouseCode})
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2  ">
//                         <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(order.status)}`}>
//                           {order.status === "unshipped" ? "unshipped" : order.status}
//                         </span>
//                       </td>
//                       <td className="px-3 py-2 text-sm font-medium text-center">
//                         <div className="flex justify-center gap-2 md:hidden">
//                           <button
//                             type="button"
//                             onClick={() => handleCloneOrder(order.id)}
//                             className="p-2 rounded-full border border-transparent text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition dark:text-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-700"
//                             title="Clone Order"
//                           >
//                             <Copy className="h-5 w-5 cursor-pointer" />
//                           </button>
//                           {order.status === 'unshipped' && (
//                             <button
//                               type="button"
//                               onClick={() => handleShipOrder(order.id)}
//                               className="p-2 rounded-full border border-transparent text-green-700 hover:bg-green-100 hover:border-green-400 transition dark:text-green-300 dark:hover:bg-green-900 dark:hover:border-green-700"
//                               title="Ship Order"
//                             >
//                               <Truck className="h-5 w-5 cursor-pointer" />
//                             </button>
//                           )}
//                           {['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'].includes(order.status) && (
//                             <button
//                               type="button"
//                               onClick={() => handleCancelOrder(order.id)}
//                               className="p-2 rounded-full border border-transparent text-orange-600 hover:bg-orange-100 hover:border-orange-400 transition dark:text-orange-500 dark:hover:bg-orange-900 dark:hover:border-orange-700"
//                               title="Cancel Order"
//                             >
//                               <XCircle className="h-5 w-5 cursor-pointer" />
//                             </button>
//                           )}
//                           <button
//                             type="button"
//                             onClick={() => handleDeleteOrder(order.id)}
//                             className="p-2 rounded-full border border-transparent text-red-600 hover:bg-red-100 hover:border-red-400 transition dark:text-red-300 dark:hover:bg-red-900 dark:hover:border-red-700"
//                             title="Delete Order"
//                           >
//                             <Trash2 className="h-5 w-5 cursor-pointer" />
//                           </button>
//                         </div>
//                         <div className="hidden md:block">
//                         <DropdownMenu >
//                           <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
//                               <span className="sr-only">Open menu</span>
//                               <MoreHorizontal className="h-4 w-4" />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end">
//                             <DropdownMenuItem onClick={() => handleCloneOrder(order.id)} className="cursor-pointer">
//                               <Copy className="mr-2 h-4 w-4" />
//                               <span>Clone Order</span>
//                             </DropdownMenuItem>
//                             {order.status === 'unshipped' && (
//                               <DropdownMenuItem onClick={() => handleShipOrder(order.id)} className="cursor-pointer">
//                                 <Truck className="mr-2 h-4 w-4" />
//                                 <span>Ship Order</span>
//                               </DropdownMenuItem>
//                             )}
//                             {['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'].includes(order.status) && (
//                               <DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-orange-600 focus:text-orange-600 dark:text-orange-500 dark:focus:text-orange-500 cursor-pointer">
//                                 <XCircle className="mr-2 h-4 w-4" />
//                                 <span>Cancel Order</span>
//                               </DropdownMenuItem>
//                             )}
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem
//                               onClick={() => handleDeleteOrder(order.id)}
//                               className="text-red-600 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
//                             >
//                               <Trash2 className="mr-2 h-4 w-4" />
//                               <span>Delete Order</span>
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {filteredOrders.length === 0 && (
//               <div className="p-12 text-center flex flex-col items-center">
//                 <Package className="h-12 w-12 mb-4 text-gray-400" />
//                 <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
//                   No orders found
//                 </h3>
//                 <p className="text-gray-500 dark:text-gray-400">
//                   Try creating a new order or adjusting your search.
//                 </p>
//               </div>
//             )}

//             <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
//               <div className="text-sm text-gray-700 dark:text-gray-400">
//                 Showing <span className="font-bold">{filteredOrders.length}</span> orders
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
//                   disabled={true}
//                 >
//                   Previous
//                 </button>
//                 <button
//                   type="button"
//                   className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
//                 >
//                   1
//                 </button>
//                 <button
//                   type="button"
//                   className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
//                   disabled={true}
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default BulkOrdersPage;




'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Trash2, Search, Plus, Package, Home, ChevronRight, Truck, MoreHorizontal, XCircle, Menu } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrderTabs } from "@/components/orderTabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id?: number;
  productName: string;
  category: string;
  quantity: number;
  orderValue: number;
  hsn: string;
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

const BulkOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const pathname = usePathname();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/orders/single-order");
      const ordersWithItems = response.data.orders.map((order: any) => ({
        ...order,
        items: order.items || [],
      }));
      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders.");
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

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to request cancellation for this shipped order? This cannot be undone.")) return;
    const toastId = toast.loading("Requesting cancellation...");
    try {
      const response = await axios.post('/api/user/orders/cancel', { orderId });
      if (response.data.success) {
        toast.update(toastId, { render: "Order cancelled successfully. Shipping cost refunded.", type: "success", isLoading: false, autoClose: 5000 });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        toast.update(toastId, { render: `Cancellation failed: ${response.data.error}`, type: "error", isLoading: false, autoClose: 5000 });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "An unexpected error occurred.";
      toast.update(toastId, { render: `Cancellation failed: ${errorMessage}`, type: "error", isLoading: false, autoClose: 5000 });
      console.error("Failed to cancel order:", error);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="p-3 sm:p-6 bg-gray-50 dark:bg-gray-900">
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

  const router = useRouter();
  const handleShipOrder = (orderId: string) => {
    router.push(`/user/dashboard/ship-order/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <main className="p-3 sm:p-6">
        <div className="max-w-full mx-auto">
          {/* Header Section with improved mobile layout */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-100 mb-2">
                Bulk Orders
              </h2>
              <OrderTabs tabs={tabs} pathname={pathname} />
              <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <Link
                  href="/user/dashboard"
                  className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  <span>Dashboard</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium">Bulk Orders</span>
              </div>
            </div>
            
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 rounded-lg w-full sm:w-64 shadow-sm border transition
                    bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-400
                    dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800
                    focus:ring-2 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button 
                type="button" 
                onClick={() => { window.location.href = '/user/dashboard/single-order' }} 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white font-semibold transition dark:bg-blue-700 dark:hover:bg-blue-800 whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                <span>New Order</span>
              </button>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {/* Cards Container with Fixed Height and Scroll */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-[calc(100vh-280px)] overflow-y-auto">
                <div className="space-y-3 p-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-1">
                            {order.orderId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status === "unshipped" ? "unshipped" : order.status}
                        </span>
                      </div>

                      {/* Customer Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Customer Details</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.customerName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payment</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.paymentMode}</div>
                        </div>
                      </div>

                      {/* Pickup Address */}
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pickup Address</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {order.warehouse?.warehouseName || "Not specified"}
                        </div>
                        {order.warehouse?.warehouseCode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {order.warehouse.warehouseCode}
                          </div>
                        )}
                      </div>

                      {/* Customer Address */}
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Customer Address</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {order.address}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Product Details</div>
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-2">
                            {order.items.map((item: OrderItem, index: number) => (
                              <div key={index} className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.productName}</div>
                                    {item.hsn && <div className="text-xs text-gray-500 dark:text-gray-400">HSN: {item.hsn}</div>}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Qty: {item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">No items</div>
                        )}
                      </div>

                      {/* Dimensions & Weight */}
                      {(order.length && order.breadth && order.height) || order.physicalWeight ? (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dimensions & Weight</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {(order.length && order.breadth && order.height) && `${order.length} × ${order.breadth} × ${order.height} cm`}
                            {(order.length && order.breadth && order.height) && order.physicalWeight && " | "}
                            {order.physicalWeight && `${order.physicalWeight} Kg`}
                          </div>
                        </div>
                      ) : null}

                      {/* Action Buttons */}
                      <div className="flex justify-center pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCloneOrder(order.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition dark:text-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800"
                          >
                            <Copy className="h-3 w-3" />
                            Clone
                          </button>
                          
                          {order.status === 'unshipped' && (
                            <button
                              onClick={() => handleShipOrder(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition dark:text-green-300 dark:bg-green-900 dark:hover:bg-green-800"
                            >
                              <Truck className="h-3 w-3" />
                              Ship
                            </button>
                          )}
                          
                          {['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'].includes(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition dark:text-orange-300 dark:bg-orange-900 dark:hover:bg-orange-800"
                            >
                              <XCircle className="h-3 w-3" />
                              Cancel
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition dark:text-red-300 dark:bg-red-900 dark:hover:bg-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredOrders.length === 0 && (
                    <div className="py-12 text-center">
                      <Package className="h-12 w-12 mb-4 text-gray-400 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        No orders found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Try creating a new order or adjusting your search.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Pagination */}
              <div className="px-4 py-3 border-t bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700 dark:text-gray-400">
                    Showing <span className="font-bold">{filteredOrders.length}</span> orders
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      disabled={true}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      disabled={true}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block shadow-2xl bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors duration-150">
                      <td className="px-3 py-2 text-sm">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {order.orderId}
                      </td>
                      <td className="px-3 py-2 text-xs align-top break-words min-w-[150px] xl:min-w-[250px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item: OrderItem, index: number) => (
                              <div key={index} className={index > 0 ? "pt-1 border-t border-gray-200 dark:border-gray-700" : ""}>
                                <span className="font-medium">{item.productName}</span> ({item.quantity}x)
                                {item.hsn && <span className="text-gray-500 dark:text-gray-400 text-[10px] block">HSN: {item.hsn}</span>}
                              </div>
                            ))}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600">
                              {(order.length && order.breadth && order.height)
                                ? `Dims: ${order.length}x${order.breadth}x${order.height} cm | `
                                : ""}
                              {order.physicalWeight
                                ? `Wt: ${order.physicalWeight} Kg`
                                : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No items</span>
                        )}
                      </td>
                      <td className="px-3 text-center py-2 text-xs font-semibold">
                        {order.paymentMode}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium">{order.customerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
                      </td>
                      <td className="px-3 py-2 text-sm max-w-xs truncate">
                        {order.address}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div>{order.warehouse?.warehouseName || "-"}</div>
                        {order.warehouse?.warehouseCode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ({order.warehouse.warehouseCode})
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(order.status)}`}>
                          {order.status === "unshipped" ? "unshipped" : order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-center">
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
                            {order.status === 'unshipped' && (
                              <DropdownMenuItem onClick={() => handleShipOrder(order.id)} className="cursor-pointer">
                                <Truck className="mr-2 h-4 w-4" />
                                <span>Ship Order</span>
                              </DropdownMenuItem>
                            )}
                            {['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'].includes(order.status) && (
                              <DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-orange-600 focus:text-orange-600 dark:text-orange-500 dark:focus:text-orange-500 cursor-pointer">
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Cancel Order</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-bold">{filteredOrders.length}</span> orders
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={true}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
                >
                  1
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={true}
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

export default BulkOrdersPage;