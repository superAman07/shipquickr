// import { UserCheck } from "lucide-react";

// export function KYCNavIcon({ status }: { status: string }) { 
//   const statusColor = {
//     pending: "text-yellow-400",
//     approved: "text-green-400",
//     rejected: "text-red-400",
//     loading: "text-gray-300",
//   };

//   const colorClass = statusColor[status?.toLowerCase() as keyof typeof statusColor] || "text-white";

//   return (
//     <div className="flex flex-col items-center relative">
//       <UserCheck className="h-8 w-8" />
//       <span
//         className={`absolute -top-2 
//           -right-6 sm:-right-12 xs:-right-10 lg:-right-14 
//           text-[6px] sm:text-[8px] md:text-xs 
//           px-1.5 py-0.5 rounded bg-transparent font-bold capitalize shadow ${colorClass}`}
//       >
//         {status}
//       </span>
//     </div>
//   );
// }

import { UserCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface KYCNavIconProps {
  status: string
  className?: string
}

export function KYCNavIcon({ status, className }: KYCNavIconProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        }
      case "rejected":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        }
      case "loading":
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        }
      default:
        return {
          icon: UserCheck,
          color: "text-slate-600",
          bgColor: "bg-slate-100",
        }
    }
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <IconComponent className={cn("h-5 w-5 sm:h-6 sm:w-6", config.color)} />
      {status === "approved" && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
      {status === "pending" && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
      )}
      {status === "rejected" && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  )
}
