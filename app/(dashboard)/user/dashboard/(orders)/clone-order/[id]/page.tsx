import CloneOrderClient from "./CloneOrderPage";

export default function CloneOrderPage({ params }: { params: { id: string } }) {
  return <CloneOrderClient orderId={params.id} />;
}