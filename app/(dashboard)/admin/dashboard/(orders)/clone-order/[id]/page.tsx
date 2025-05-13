import CloneOrderClient from "./CloneOrderPage"; 

export default function CloneOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const id  = params.id;     
  if (!id || id === "undefined") { 
    return <div>Error: Order ID is missing or invalid.</div>;
  }     
  return <CloneOrderClient orderIdToClone={id} />;
}