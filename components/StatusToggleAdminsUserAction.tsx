"use client"

import { useState } from "react" 
import { SwitchIcon } from "./ui/SwitchIcon"

export function StatusToggle() {
  const [checked, setChecked] = useState(false)

  const handleToggle = (newVal: boolean) => {
    setChecked(newVal)
    // Baad me backend ka code yaha aa sakta hai
  }

  return (
    <SwitchIcon
      checked={checked}
      onCheckedChange={handleToggle}
      className="h-6 w-10"
    />
  )
}
