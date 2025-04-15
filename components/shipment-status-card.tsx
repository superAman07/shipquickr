import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ShipmentStatusCardProps {
  count: string
  percentage: string
  status: string
  color: string
}

export default function ShipmentStatusCard({ count, percentage, status, color }: ShipmentStatusCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-semibold">{count}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{percentage}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{status}</div>
        <div className={cn("h-1 w-full mt-3 rounded-full", color)}></div>
      </CardContent>
    </Card>
  )
}
