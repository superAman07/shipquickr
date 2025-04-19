import { UserCheck } from "lucide-react";

export function KYCNavIcon({ status }: { status: string }) { 
  const statusColor = {
    pending: "text-yellow-400",
    approved: "text-green-400",
    rejected: "text-red-400",
    loading: "text-gray-300",
  };

  const colorClass = statusColor[status?.toLowerCase() as keyof typeof statusColor] || "text-white";

  return (
    <div className="flex flex-col items-center relative">
      <UserCheck className="h-8 w-8" />
      <span
        className={`absolute -top-2 -right-14 text-[10px] px-2 py-0.5 rounded bg-transparent font-bold capitalize shadow ${colorClass}`}
      >
        {status}
      </span>
    </div>
  );
}
