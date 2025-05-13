"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
 
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
  status: string;  
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
  
  length?: number;
  breadth?: number;
  height?: number;
  physicalWeight?: number;
  codAmount?: string;  
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const formatDetailAddress = (order: Order | null) => {
    if (!order) return "N/A";
    const parts = [
        order.address,
        order.landmark,
        order.city,
        order.state,
        order.pincode,
    ].filter(Boolean);  
    return parts.join(', ') || "N/A";
};


const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) {
    return null;
  }

  const totalItemsValue = order.items.reduce((sum, item) => sum + (item.orderValue * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Order Details: {order.orderId}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto"> 
          {order.user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">User</h3>
                <p className="text-gray-800 dark:text-gray-100">{order.user.firstName || ''} {order.user.lastName || ''} ({order.user.email})</p>
              </div>
            </div>
          )}
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Name</h3>
              <p className="text-gray-800 dark:text-gray-100">{order.customerName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact</h3>
              <p className="text-gray-800 dark:text-gray-100">{order.mobile}{order.email ? ` / ${order.email}` : ''}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Address</h3>
              <p className="text-gray-800 dark:text-gray-100">{formatDetailAddress(order)}</p>
            </div>
             <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</h3>
              <p className="text-gray-800 dark:text-gray-100">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className="text-gray-800 dark:text-gray-100 capitalize">{order.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Mode</h3>
              <p className="text-gray-800 dark:text-gray-100">{order.paymentMode} {order.paymentMode === "COD" && order.codAmount ? `(₹${order.codAmount})` : ""}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Order Value</h3>
              <p className="text-gray-800 dark:text-gray-100">₹{order.totalAmount?.toFixed(2) || totalItemsValue.toFixed(2)}</p>
            </div>
          </div>
 
          {(order.awbNumber || order.courierName || order.pickupLocation) && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200 pt-3 border-t dark:border-gray-700">Shipment Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">AWB Number</h3>
                  <p className="text-gray-800 dark:text-gray-100">{order.awbNumber || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Courier</h3>
                  <p className="text-gray-800 dark:text-gray-100">{order.courierName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pickup Location</h3>
                  <p className="text-gray-800 dark:text-gray-100">{order.pickupLocation || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
           
          {(order.length || order.physicalWeight) && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200 pt-3 border-t dark:border-gray-700">Package Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions (LxBxH cm)</h3>
                  <p className="text-gray-800 dark:text-gray-100">
                    {order.length && order.breadth && order.height ? `${order.length} x ${order.breadth} x ${order.height}` : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight (Kg)</h3>
                  <p className="text-gray-800 dark:text-gray-100">{order.physicalWeight || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
 
          <div>
            <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200 pt-3 border-t dark:border-gray-700">Items ({order.items.length})</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {order.items.map((item, index) => (
                <li key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{item.productName}</span>
                    <span className="text-gray-700 dark:text-gray-200">Qty: {item.quantity}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Value: ₹{item.orderValue?.toFixed(2)} each
                    {item.hsn && ` | HSN: ${item.hsn}`}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;