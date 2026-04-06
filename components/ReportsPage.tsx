'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Copy,
  Trash2,
  Search,
  Package,
  Home,
  ChevronRight,
  Download,
  MoreHorizontal,
  X,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import OrderDetailDrawer from '@/components/OrderDetailDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  items: OrderItem[];
  customerName: string;
  mobile: string;
  paymentMode?: string;
  address: string;
  pickupLocation?: string;
  billableWeight?: number | string;
  ageing?: number | string;
  attempts?: number | string;
  shippingDetails?: string;
  status: string;
  length?: number | string;
  breadth?: number | string;
  height?: number | string;
  physicalWeight?: number | string;
  awbNumber?: string;
  labelUrl?: string;
  courierName?: string;
  warehouse?: { warehouseName: string; warehouseCode: string } | null;
}

type TabKey =
  | 'all'
  | 'in_transit'
  | 'out_for_delivery'
  | 'unshipped'
  | 'delivered'
  | 'undelivered'
  | 'rto_intransit'
  | 'rto_delivered'
  | 'lost_shipment';

const TABS: { key: TabKey; label: string; status: string | undefined }[] = [
  { key: 'all', label: 'ALL-SHIPMENT', status: undefined },
  { key: 'in_transit', label: 'IN-TRANSIT', status: 'in_transit' },
  { key: 'out_for_delivery', label: 'OUT FOR DELIVERY', status: 'out_for_delivery' },
  { key: 'unshipped', label: 'UNSHIPPED', status: 'unshipped' },
  { key: 'delivered', label: 'DELIVERED', status: 'delivered' },
  { key: 'undelivered', label: 'UNDELIVERED', status: 'undelivered' },
  { key: 'rto_intransit', label: 'RTO INTRANSIT', status: 'rto_intransit' },
  { key: 'rto_delivered', label: 'RTO DELIVERED', status: 'rto_delivered' },
  { key: 'lost_shipment', label: 'LOST SHIPMENT', status: 'lost_shipment' },
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

const ReportsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') as TabKey) || 'all';
  const currentTabObj = TABS.find((t) => t.key === tabParam) || TABS[0];

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1);
  }, [tabParam]);

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const status = currentTabObj.status;
      const url = status
        ? `/api/user/orders/single-order?status=${status}`
        : `/api/user/orders/single-order`;

      const response = await axios.get(url);

      const ordersWithItems = response.data.orders.map((order: any) => ({
        ...order,
        items: order.items || [],
      }));

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(`Failed to load ${currentTabObj.label} orders.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneOrder = (orderId: string) => {
    window.location.href = `/user/dashboard/clone-order/${orderId}`;
  };

  const handleRowClick = (order: Order, e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('input[type="checkbox"]')
    ) {
      return;
    }

    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (order.awbNumber && order.awbNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.courierName && order.courierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedOrders.length && !selectAllAcrossPages) {
      setSelectedIds(new Set());
      setSelectAllAcrossPages(false);
    } else {
      setSelectedIds(new Set(paginatedOrders.map((o) => o.id)));
      setSelectAllAcrossPages(false);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectAllAcrossPages(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllPageSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id));

  const effectiveSelectedOrders = selectAllAcrossPages
    ? filteredOrders
    : filteredOrders.filter((o) => selectedIds.has(o.id));

  const effectiveSelectedCount = selectAllAcrossPages ? filteredOrders.length : selectedIds.size;

  const isSomeSelected = effectiveSelectedCount > 0;

  const calculateTotalOrderValue = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.orderValue * item.quantity, 0);
  };

  function downloadCSV(ordersToDownload: Order[]) {
    if (!orders.length) return;

    const headers = [
      'Order Date',
      'Order ID',
      'AWB Number',
      'Product Details',
      'Payment',
      'Order Value',
      'Customer',
      'Address',
      'Pickup Location',
      'Status',
      'Label URL',
    ];

    const rows = ordersToDownload.map((order) => {
      const productDetails = order.items
        .map((item) => `${item.productName} (${item.quantity}x)`)
        .join('; ');

      const dims =
        order.length && order.breadth && order.height
          ? `Dims: ${order.length}x${order.breadth}x${order.height}cm`
          : '';

      const wt = order.physicalWeight ? `Wt: ${order.physicalWeight}Kg` : '';
      const fullProductDetails = `${productDetails}${
        dims || wt ? ` | ${[dims, wt].filter(Boolean).join(' | ')}` : ''
      }`;
      const totalValue = calculateTotalOrderValue(order.items);

      return [
        new Date(order.orderDate).toLocaleDateString(),
        order.orderId,
        order.awbNumber || '-',
        fullProductDetails,
        order.paymentMode || '-',
        totalValue.toFixed(2),
        `${order.customerName} (${order.mobile})`,
        order.address,
        order.pickupLocation || '-',
        order.status,
        order.labelUrl || '-',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((field) => `"${(field ?? '').toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${currentTabObj.label.toLowerCase().replace(/ /g, '-')}-report.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 dark:bg-[#10162A] sm:p-6">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 animate-pulse dark:border-gray-800 dark:bg-gray-900">
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
      <div className="px-4 pb-0 pt-4 sm:px-0 sm:pt-0">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-800 dark:text-white sm:text-3xl">
              Reports
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
              <span>Reports</span>
              <ChevronRight className="mx-0.5 h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {currentTabObj.label.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders, AWB..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#0a0c37] focus:ring-2 focus:ring-[#0a0c37]/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 sm:w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <button
              onClick={() =>
                downloadCSV(isSomeSelected ? effectiveSelectedOrders : filteredOrders)
              }
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0a0c37] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {isSomeSelected ? `Download (${effectiveSelectedCount})` : 'Download'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0 -mb-px custom-scrollbar">
          {TABS.map((tab) => {
            const isActive = tabParam === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => router.push(`/user/dashboard/reports?tab=${tab.key}`)}
                className={`relative cursor-pointer whitespace-nowrap rounded-t-xl px-4 py-2.5 text-[11px] uppercase tracking-wider font-bold transition-all ${
                  isActive
                    ? 'border border-b-0 border-gray-200 bg-white text-[#0a0c37] shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-indigo-400'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-[#0a0c37] dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shadow-xs overflow-hidden rounded-xl rounded-tl-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827]">
        <div className="block lg:hidden">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="space-y-3 p-4">
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-transform active:scale-[0.99] dark:border-gray-700 dark:bg-gray-800"
                  onClick={(e) => handleRowClick(order, e)}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 break-all text-sm font-bold text-[#0a0c37] dark:text-indigo-300">
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
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
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
                      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Payment
                      </div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {order.paymentMode || 'Prepaid'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Products
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white p-2 dark:border-gray-600 dark:bg-gray-700/50">
                      {order.items.length > 0 ? (
                        <div className="space-y-1 text-xs">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={
                                idx > 0 ? 'border-t border-gray-200 pt-1 dark:border-gray-600' : ''
                              }
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

                  <div className="flex flex-wrap justify-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloneOrder(order.id);
                      }}
                      className="flex flex-1 justify-center cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                    >
                      <Copy className="h-3 w-3" />
                      Clone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative border-t border-gray-200 dark:border-gray-800">
          <div className="overflow-auto w-full max-h-[calc(100vh-250px)] custom-scrollbar">
            <table className="min-w-full text-left border-separate border-spacing-0 whitespace-nowrap">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="text-white">
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-gray-400 text-[#0a0c37] focus:ring-[#0a0c37] cursor-pointer accent-white"
                    />
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Date / ID
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200 min-w-[200px]">
                    Product Details
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Order Value
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Customer Details
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Billable Weight
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Ageing
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Attempts
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-200 max-w-[150px]">
                    Shipping Details
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Status
                  </th>
                  <th className="bg-[#0a0c37] border-b border-gray-800 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-200">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-[#111827]">
                {isAllPageSelected &&
                  !selectAllAcrossPages &&
                  filteredOrders.length > paginatedOrders.length && (
                    <tr>
                      <td
                        colSpan={11}
                        className="bg-indigo-50 dark:bg-indigo-900/20 py-2 text-center text-sm border-b border-indigo-100 dark:border-indigo-800"
                      >
                        <span className="text-gray-600 dark:text-gray-300">
                          All <strong>{paginatedOrders.length}</strong> on this page are selected.
                        </span>{' '}
                        <button
                          onClick={() => {
                            setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
                            setSelectAllAcrossPages(true);
                          }}
                          className="font-bold text-[#0a0c37] dark:text-indigo-400 underline underline-offset-2 cursor-pointer hover:opacity-80"
                        >
                          Select all {filteredOrders.length} reports
                        </button>
                      </td>
                    </tr>
                  )}

                {selectAllAcrossPages && (
                  <tr>
                    <td
                      colSpan={11}
                      className="bg-indigo-50 dark:bg-indigo-900/20 py-2 text-center text-sm border-b border-indigo-100 dark:border-indigo-800"
                    >
                      <span className="font-semibold text-[#0a0c37] dark:text-indigo-400">
                        All {filteredOrders.length} reports are selected.
                      </span>{' '}
                      <button
                        onClick={() => {
                          setSelectedIds(new Set());
                          setSelectAllAcrossPages(false);
                        }}
                        className="font-bold text-gray-500 underline underline-offset-2 cursor-pointer hover:opacity-80"
                      >
                        Clear selection
                      </button>
                    </td>
                  </tr>
                )}

                {paginatedOrders.map((order) => {
                  const totalValue = calculateTotalOrderValue(order.items);

                  return (
                    <tr
                      key={order.id}
                      onClick={(e) => handleRowClick(order, e)}
                      className={`group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer relative align-top ${
                        selectedIds.has(order.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <td
                        className="px-3 py-4 border-b border-gray-200 dark:border-gray-800 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#0a0c37] focus:ring-[#0a0c37] cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <span className="font-bold text-[#0a0c37] dark:text-indigo-400 text-[13px] block">
                          {order.orderId}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 whitespace-normal min-w-[200px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className={`text-[12px] text-gray-800 dark:text-gray-200 ${
                                  idx > 0 ? 'pt-1 border-t border-gray-100 dark:border-gray-800' : ''
                                }`}
                              >
                                <span className="font-semibold uppercase tracking-tight">
                                  {item.productName}
                                </span>{' '}
                                <span className="text-gray-500">x{item.quantity}</span>
                                {item.hsn && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    HSN: {item.hsn}
                                  </div>
                                )}
                              </div>
                            ))}

                            <div className="text-[10px] text-gray-500 mt-1.5 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                              {order.length && order.breadth && order.height
                                ? `Dims: ${order.length}x${order.breadth}x${order.height}cm `
                                : ''}
                              {order.length && order.breadth && order.height && order.physicalWeight
                                ? '| '
                                : ''}
                              {order.physicalWeight ? `Wt: ${order.physicalWeight}Kg` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                          {'₹'}
                          {totalValue.toFixed(0)}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">
                          {order.paymentMode || 'PREPAID'}
                        </div>
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-[13px] font-bold uppercase text-gray-900 dark:text-gray-100">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {order.mobile}
                        </div>
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center font-medium text-gray-600">
                        {order.billableWeight || '—'}
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center font-medium text-gray-600">
                        {order.ageing || '0'}
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center font-medium text-gray-600">
                        {order.attempts || '0'}
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="text-[12px] font-bold text-[#0a0c37] dark:text-indigo-400">
                          {order.awbNumber || '—'}
                        </div>
                        <div
                          className="text-[11px] font-medium text-gray-500 mt-0.5 max-w-[150px] truncate"
                          title={order.courierName || order.shippingDetails || ''}
                        >
                          {order.courierName || order.shippingDetails || '—'}
                        </div>
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                        <SBadge status={order.status} />
                      </td>

                      <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 text-center">
                        <div
                          className="inline-flex justify-center -space-x-px rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 mx-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCloneOrder(order.id)}
                            className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:ring-gray-700 focus:z-10 rounded-l-xl cursor-pointer"
                            title="Clone"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-10 rounded-r-xl cursor-pointer">
                                <span className="sr-only">More</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48 p-1 z-[80]">
                              <DropdownMenuItem
                                onClick={() => toast.info('Delete managed from Orders natively')}
                                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-16 text-center border-b border-gray-200 dark:border-gray-800"
                    >
                      <Package className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <h3 className="mb-1 text-base font-semibold text-gray-500 dark:text-gray-400">
                        No records found
                      </h3>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing{' '}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{' '}
            {'–'}{' '}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {filteredOrders.length}
            </span>{' '}
            reports
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Rows:</span>
            <select
              value={itemsPerPage === filteredOrders.length ? 'all' : itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? filteredOrders.length : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
                setSelectedIds(new Set());
                setSelectAllAcrossPages(false);
              }}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-1.5 cursor-pointer focus:ring-2 focus:ring-[#0a0c37]/40 outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>

            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0a0c37] text-white min-w-[50px] text-center">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {isSomeSelected && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl bg-[#0a0c37] px-5 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">
                  {effectiveSelectedCount} selected
                </span>
              </div>

              <div className="h-5 w-px bg-white/20" />

              <button
                onClick={() => downloadCSV(effectiveSelectedOrders)}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download Selected
              </button>

              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectAllAcrossPages(false);
                }}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailDrawer
        order={selectedOrder as any}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onClone={handleCloneOrder}
        onDelete={() => toast.info('Delete action is handled from main Orders terminal')}
        onShip={() => toast.info('Shipment modifications run from main Orders')}
        onCancel={() => toast.info('Cancellations disabled in static reports')}
        onRefreshStatus={() => toast.info('Live refresh locked in reports scope')}
        onDownloadLabel={() => toast.info('Please use the table row download')}
        refreshingId={null}
        downloadingLabelId={null}
      />
    </div>
  );
};

export default ReportsPage;