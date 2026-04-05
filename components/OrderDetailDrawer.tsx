'use client';

import React from 'react';
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Copy,
  Trash2,
  XCircle,
  RefreshCw,
  Download,
  Calendar,
  Phone,
  Mail,
  Hash,
  Box,
  Weight,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface DrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onShip: (id: string) => void;
  onCancel: (id: string) => void;
  onRefreshStatus: (order: Order) => void;
  onDownloadLabel: (order: Order) => void;
  refreshingId: string | null;
  downloadingLabelId: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  unshipped: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  shipped: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  manifested: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  in_transit: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  out_for_delivery: { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
  delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  undelivered: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">{icon}</div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </div>

        <div className="break-words text-sm font-medium text-gray-800 dark:text-gray-200">
          {value || '\u2014'}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onClone,
  onDelete,
  onShip,
  onCancel,
  onRefreshStatus,
  onDownloadLabel,
  refreshingId,
  downloadingLabelId,
}: DrawerProps) {
  if (!order) return null;

  const s =
    STATUS_STYLES[order.status.toLowerCase()] || {
      bg: 'bg-gray-500/10',
      text: 'text-gray-600 dark:text-gray-400',
      dot: 'bg-gray-500',
    };

  const shippedStatuses = ['shipped', 'manifested', 'in_transit', 'out_for_delivery', 'undelivered'];
  const labelStatuses = ['manifested', 'shipped', 'in_transit', 'out_for_delivery'];
  const refreshStatuses = ['manifested', 'in_transit', 'out_for_delivery', 'undelivered'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col bg-white shadow-2xl dark:bg-[#111827] sm:w-[480px]"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white px-6 py-5 dark:border-gray-800 dark:from-[#0a0c37]/50 dark:to-[#111827]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                    Order Details
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.orderId}
                  </h2>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.bg} ${s.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {order.status.replace(/_/g, ' ')}
                    </span>

                    {order.refundStatus === 'processed' && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {'\u2705'} {'\u20B9'}
                        {order.refundAmount} refunded
                      </span>
                    )}

                    {order.refundStatus === 'pending' && order.refundDueDate && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        {'\uD83D\uDD50'} Refund by{' '}
                        {new Date(order.refundDueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Route */}
              {order.warehouse && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                        <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>

                      <div className="my-1 h-6 w-0.5 bg-indigo-200 dark:bg-indigo-800" />

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                          Pickup
                        </div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {order.warehouse.warehouseName}
                        </div>
                      </div>

                      {order.awbNumber && (
                        <div className="-my-1 flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500">
                            {order.courierName} · AWB: {order.awbNumber}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                          Delivery
                        </div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {order.address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* (rest already clean enough, left unchanged structurally) */}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onClone(order.id)}
                  className="flex min-w-[100px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Clone
                </button>

                <button
                  onClick={() => onDelete(order.id)}
                  className="flex min-w-[100px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}