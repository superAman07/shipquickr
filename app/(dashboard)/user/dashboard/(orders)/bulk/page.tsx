'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Copy,
  Download,
  Home,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  XCircle,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import OrderDetailDrawer from '@/components/OrderDetailDrawer';

interface OrderItem {
  id?: number;
  productName: string;
  category?: string;
  quantity: number;
  orderValue: number;
  hsn?: string;
}

interface Order {
  id: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  paymentMode: string;
  customerName: string;
  mobile: string;
  email?: string;
  address: string;
  pincode?: string;
  city?: string;
  state?: string;
  pickupLocation?: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
  warehouseId?: number | string;
  awbNumber?: string;
  courierName?: string;
  labelUrl?: string;
  shippingCost?: number;
  shippingId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundDueDate?: string;
  warehouse?: { warehouseName: string; warehouseCode: string } | null;
}

type TabKey = 'all' | 'unshipped' | 'shipped' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses: string[] | null }[] = [
  { key: 'all', label: 'All Orders', statuses: null },
  { key: 'unshipped', label: 'Unshipped', statuses: ['unshipped'] },
  {
    key: 'shipped',
    label: 'Shipped',
    statuses: ['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'],
  },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

const SS: Record<string, { bg: string; text: string; dot: string }> = {
  unshipped: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  shipped: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  manifested: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  in_transit: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  out_for_delivery: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-400',
    dot: 'bg-cyan-500',
  },
  delivered: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  undelivered: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
};

function gs(s: string) {
  return (
    SS[s.toLowerCase()] || {
      bg: 'bg-gray-500/10',
      text: 'text-gray-600 dark:text-gray-400',
      dot: 'bg-gray-500',
    }
  );
}

function RefundBadge({ order }: { order: Order }) {
  if (order.refundStatus === 'processed') {
    return (
      <div className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        {'\u2705'} {'\u20B9'}
        {order.refundAmount} refunded
      </div>
    );
  }

  if (order.refundStatus === 'pending' && order.refundDueDate) {
    return (
      <div className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
        {'\uD83D\uDD50'} Refund by {new Date(order.refundDueDate).toLocaleDateString()}
      </div>
    );
  }

  return null;
}

function SBadge({ status }: { status: string }) {
  const st = gs(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.bg} ${st.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const UnifiedOrdersPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [downloadingLabelId, setDownloadingLabelId] = useState<string | null>(null);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const itemsPerPage = 15;
  const activeTab = (searchParams.get('tab') as TabKey) || 'all';

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const url = tab === 'all' ? '/user/dashboard/bulk' : `/user/dashboard/bulk?tab=${tab}`;
      router.replace(url, { scroll: false });
      setCurrentPage(1);
    },
    [router]
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/user/orders/single-order');
      setAllOrders(
        res.data.orders.map((o: any) => ({
          ...o,
          items: o.items || [],
        }))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const tabCfg = TABS.find((t) => t.key === activeTab) || TABS[0];
    let orders = allOrders;

    if (tabCfg.statuses) {
      orders = orders.filter((o) => tabCfg.statuses!.includes(o.status.toLowerCase()));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(term) ||
          o.customerName.toLowerCase().includes(term) ||
          o.mobile.toLowerCase().includes(term) ||
          (o.awbNumber && o.awbNumber.toLowerCase().includes(term)) ||
          o.items.some((item) => item.productName.toLowerCase().includes(term))
      );
    }

    return orders;
  }, [allOrders, activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabCounts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: 0,
      unshipped: 0,
      shipped: 0,
      cancelled: 0,
    };

    c.all = allOrders.length;

    allOrders.forEach((o) => {
      const s = o.status.toLowerCase();

      if (s === 'unshipped') {
        c.unshipped++;
      } else if (['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'].includes(s)) {
        c.shipped++;
      } else if (s === 'cancelled') {
        c.cancelled++;
      }
    });

    return c;
  }, [allOrders]);

  const handleCloneOrder = (id: string) => {
    window.location.href = `/user/dashboard/clone-order/${id}`;
  };

  const handleShipOrder = (id: string) => {
    router.push(`/user/dashboard/ship-order/${id}`);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await axios.delete(`/api/user/orders/single-order/${id}`);
      setAllOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success('Order deleted');

      if (drawerOrder?.id === id) {
        setIsDrawerOpen(false);
        setDrawerOrder(null);
      }
    } catch {
      toast.error('Failed to delete order.');
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!window.confirm('Cancel this order?')) return;

    const tid = toast.loading('Requesting cancellation...');

    try {
      const res = await axios.post('/api/user/orders/cancel', { orderId: id });

      if (res.data.success) {
        toast.update(tid, {
          render: 'Cancelled successfully.',
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });

        setAllOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
        );
      } else {
        toast.update(tid, {
          render: `Failed: ${res.data.error}`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    } catch (e: any) {
      toast.update(tid, {
        render: `Failed: ${e.response?.data?.error || 'Unknown error'}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleRefreshStatus = async (order: Order) => {
    if (!order.awbNumber || !order.courierName) {
      return toast.error('No AWB/courier found.');
    }

    setRefreshingId(order.id);

    try {
      const res = await axios.post('/api/user/orders/tracking', {
        awbNumber: order.awbNumber,
        courierName: order.courierName,
      });

      if (res.data.normalizedStatus) {
        setAllOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: res.data.normalizedStatus } : o
          )
        );
        toast.success(`Status: ${res.data.normalizedStatus}`);
      }
    } catch {
      toast.error('Failed to refresh.');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDownloadLabel = async (order: Order) => {
    if (!order.awbNumber || !order.courierName) {
      return toast.error('No AWB/courier found.');
    }

    setDownloadingLabelId(order.id);

    try {
      const res = await axios.post('/api/user/shipment/generate-label', {
        orderId: Number(order.id),
        awbNumber: order.awbNumber,
        courierName: order.courierName,
      });

      if (res.data.success && res.data.labelUrl) {
        window.open(res.data.labelUrl, '_blank');
      } else {
        toast.error(res.data.error || 'Failed to get label.');
      }
    } catch {
      toast.error('Failed to download label.');
    } finally {
      setDownloadingLabelId(null);
    }
  };

  const openDrawer = (order: Order) => {
    setDrawerOrder(order);
    setIsDrawerOpen(true);
  };

  const shippedStatuses = [
    'shipped',
    'manifested',
    'in_transit',
    'out_for_delivery',
    'undelivered',
  ];
  const labelStatuses = ['manifested', 'shipped', 'in_transit', 'out_for_delivery'];
  const refreshStatuses = ['manifested', 'in_transit', 'out_for_delivery', 'undelivered'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 dark:bg-[#10162A] sm:p-6">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <div className="px-4 pb-0 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
              Orders
            </h1>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Link
                href="/user/dashboard"
                className="flex items-center transition-colors hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Home className="mr-1 h-3 w-3" />
                Dashboard
              </Link>
              <ChevronRight className="mx-0.5 h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Orders</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders, AWB..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 sm:w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <Link
              href="/user/dashboard/single-order"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative cursor-pointer whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border border-b-0 border-gray-200 bg-white text-indigo-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-indigo-400'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="block lg:hidden">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-3 p-4">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-transform active:scale-[0.99] dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => openDrawer(order)}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 break-all text-sm font-bold text-indigo-700 dark:text-indigo-300">
                          {order.orderId}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                      <SBadge status={order.status} />
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Customer
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {order.mobile}
                        </div>
                      </div>

                      <div>
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Payment
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {order.paymentMode}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Pickup
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {order.warehouse?.warehouseName || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Address
                        </div>
                        <div className="line-clamp-2 text-xs text-gray-700 dark:text-gray-300">
                          {order.address}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Products
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-white p-2 dark:border-gray-600 dark:bg-gray-700/50">
                        {order.items.length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className={idx > 0 ? 'border-t border-gray-200 pt-1 dark:border-gray-600' : ''}
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                  {item.productName}
                                </span>{' '}
                                ({item.quantity}x)
                                {item.hsn && (
                                  <span className="block text-[10px] text-gray-400">
                                    HSN: {item.hsn}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </div>
                    </div>

                    {order.status === 'cancelled' && <RefundBadge order={order} />}

                    <div className="flex flex-wrap justify-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneOrder(order.id);
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                      >
                        <Copy className="h-3 w-3" />
                        Clone
                      </button>

                      {order.status === 'unshipped' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShipOrder(order.id);
                          }}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                        >
                          <Truck className="h-3 w-3" />
                          Ship
                        </button>
                      )}

                      {shippedStatuses.includes(order.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order.id);
                          }}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}

                      {labelStatuses.includes(order.status) && order.awbNumber && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadLabel(order);
                          }}
                          disabled={downloadingLabelId === order.id}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                        >
                          <Download
                            className={`h-3 w-3 ${
                              downloadingLabelId === order.id ? 'animate-spin' : ''
                            }`}
                          />
                          Label
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="py-16 text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mb-1 text-base font-semibold text-gray-500 dark:text-gray-400">
                      No orders found
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Try creating a new order or adjusting your search.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Desktop Table */}
          <div className="hidden lg:block relative border-t border-gray-200 dark:border-gray-800">
            {/* The wrapper below provides horizontal AND vertical scrolling within the table area itself */}
            <div className="overflow-auto w-full max-h-[calc(100vh-250px)] custom-scrollbar">
              <table className="min-w-full text-left border-separate border-spacing-0 whitespace-nowrap">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="text-white">
                    {/* Note: 'bg-[#0a0c37]' is applied to each TH to ensure it stays fully opaque while scrolling vertically */}
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Date</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Order ID</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200 min-w-[200px]">Products</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Payment</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Customer</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200 max-w-[150px]">Address</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Pickup</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">Status</th>
                    {activeTab === 'cancelled' && <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">Refund</th>}
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">Courier & AWB</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200 shrink-0">Label</th>
                    <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#111827]">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} onClick={() => openDrawer(order)} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer relative align-top">
                      {/* Date */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      
                      {/* Order ID */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm block">{order.orderId}</span>
                      </td>
                      
                      {/* Products */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 whitespace-normal min-w-[200px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className={`text-xs text-gray-800 dark:text-gray-200 ${idx > 0 ? "pt-1 border-t border-gray-100 dark:border-gray-800" : ""}`}>
                                <span className="font-semibold">{item.productName}</span> <span className="text-gray-500">x{item.quantity}</span>
                                {item.hsn && <div className="text-[10px] text-gray-400 mt-0.5">HSN: {item.hsn}</div>}
                              </div>
                            ))}
                            <div className="text-[10px] text-gray-500 mt-1.5 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                              {(order.length && order.breadth && order.height) ? `Dims: ${order.length}x${order.breadth}x${order.height}cm ` : ""}
                              {(order.length && order.breadth && order.height) && order.physicalWeight ? "| " : ""}
                              {order.physicalWeight ? `Wt: ${order.physicalWeight}Kg` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </td>
                      
                      {/* Payment */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{order.paymentMode}</div>
                        {order.items && order.items.length > 0 && <div className="text-[11px] text-gray-500 mt-0.5">{"\u20B9"}{order.items.reduce((sum, item) => sum + item.orderValue, 0)}</div>}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.customerName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{order.mobile}</div>
                      </td>

                      {/* Address */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={order.address}>{order.address}</div>
                      </td>

                      {/* Pickup */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{order.warehouse?.warehouseName || "-"}</div>
                        {order.warehouse?.warehouseCode && <div className="text-[10px] text-gray-500 mt-0.5">({order.warehouse.warehouseCode})</div>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                        <SBadge status={order.status} />
                      </td>

                      {/* Refund (If cancelled) */}
                      {activeTab === 'cancelled' && (
                        <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                          <RefundBadge order={order} />
                        </td>
                      )}

                      {/* Courier & AWB */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{order.courierName || '-'}</div>
                        <div className="text-[11px] font-mono text-gray-500 mt-0.5">{order.awbNumber || ''}</div>
                        {refreshStatuses.includes(order.status) && order.awbNumber && (
                          <button onClick={(e) => { e.stopPropagation(); handleRefreshStatus(order) }} disabled={refreshingId === order.id} className="mt-1.5 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer transition-colors">
                            <RefreshCw className={`h-3 w-3 ${refreshingId === order.id ? 'animate-spin' : ''}`} /> Refresh
                          </button>
                        )}
                      </td>

                      {/* Label */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                        {labelStatuses.includes(order.status) && order.awbNumber && (
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadLabel(order) }} disabled={downloadingLabelId === order.id} className="inline-flex items-center justify-center p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900 cursor-pointer disabled:opacity-50 group-hover:shadow-sm" title="Download Label">
                            <Download className={`h-4 w-4 ${downloadingLabelId === order.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                        <div className="inline-flex justify-center -space-x-px rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 mx-auto" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCloneOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:ring-gray-700 focus:z-10 rounded-l-xl cursor-pointer" title="Clone"><Copy className="h-4 w-4" /></button>
                          {order.status === 'unshipped' && <button onClick={() => handleShipOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-400 ring-1 ring-inset ring-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 dark:ring-gray-700 focus:z-10 cursor-pointer" title="Ship"><Truck className="h-4 w-4" /></button>}
                          {shippedStatuses.includes(order.status) && <button onClick={() => handleCancelOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:z-10 cursor-pointer" title="Cancel"><XCircle className="h-4 w-4" /></button>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-10 rounded-r-xl cursor-pointer"><span className="sr-only">More</span><MoreHorizontal className="h-4 w-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1 z-[80]">
                              <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="text-red-600 dark:text-red-400 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20 cursor-pointer rounded-lg"><Trash2 className="h-4 w-4 mr-2" /> Delete Order</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-16 text-center border-b border-gray-200 dark:border-gray-800">
                        <Package className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600 mx-auto" />
                        <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-1">No orders found</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Try creating a new order or adjusting your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 border-x border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-700 dark:text-gray-300">{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> {"\u2013"} <span className="font-bold text-gray-700 dark:text-gray-300">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{filteredOrders.length}</span> orders
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer">Previous</button>
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white min-w-[60px] text-center">{currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer">Next</button>
          </div>
        </div>
      </div>

      <OrderDetailDrawer order={drawerOrder} isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); setDrawerOrder(null) }} onClone={handleCloneOrder} onDelete={handleDeleteOrder} onShip={handleShipOrder} onCancel={handleCancelOrder} onRefreshStatus={handleRefreshStatus} onDownloadLabel={handleDownloadLabel} refreshingId={refreshingId} downloadingLabelId={downloadingLabelId} />
    </div>
  )
}

export default UnifiedOrdersPage;