import { Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ShipmentCardProps {
  title: string
  value: string
  info: string
  color: string
}

export default function ShipmentCard({ title, value, info, color }: ShipmentCardProps) {
  return (
    <Card className="overflow-hidden border-0 max-w-xs w-full shadow-sm">
      <div className={cn("text-white rounded-2xl p-4", color)}>
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <div className="flex items-center mt-4 text-xs">
          <Info className="h-3 w-3 mr-1" />
          <span>{info}</span>
        </div>
      </div>
    </Card>
  )
}
