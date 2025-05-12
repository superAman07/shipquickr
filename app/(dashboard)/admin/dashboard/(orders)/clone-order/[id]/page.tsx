import CloneOrderClient from "./CloneOrderPage";
import { use } from "react";

export default function CloneOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);           
  return <CloneOrderClient orderId={id} />;
}