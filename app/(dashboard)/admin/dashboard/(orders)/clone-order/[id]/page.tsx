"use client";

import { useParams } from "next/navigation";
import CloneOrderPageClient from "./CloneOrderPage";

export default function CloneOrderPage() {
  const params = useParams();
  const orderIdParam = params?.id;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
  if (!orderId) {
    return <div>Error: Order ID is missing or invalid.</div>;
  }
  return <CloneOrderPageClient orderIdToClone={orderId} />;
}
