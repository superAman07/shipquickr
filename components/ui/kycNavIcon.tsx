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
        className={`absolute -top-2 
          -right-6 sm:-right-12 xs:-right-10 lg:-right-14 
          text-[6px] sm:text-[8px] md:text-xs 
          px-1.5 py-0.5 rounded bg-transparent font-bold capitalize shadow ${colorClass}`}
      >
        {status}
      </span>
    </div>
  );
}
