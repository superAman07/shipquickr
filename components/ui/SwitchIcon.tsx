// components/ui/SwitchIcon.tsx
import { ToggleLeft, ToggleRight } from "lucide-react"

interface SwitchIconProps {
  checked: boolean
  onCheckedChange: (val: boolean) => void
  disabled?: boolean
  className?: string
}

export function SwitchIcon({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
}: SwitchIconProps) {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`flex items-center justify-center transition-opacity ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {checked ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-500" />}
    </button>
  )
}
