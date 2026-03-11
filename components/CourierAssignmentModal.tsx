"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Package, Loader2 } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

// Add or remove couriers from this master list as your business grows
const AVAILABLE_COURIERS = [
  {
    id: "Delhivery Surface",
    name: "Delhivery Surface",
    description: "Cost-effective ground shipping"
  },
  {
    id: "Delhivery Express",
    name: "Delhivery Express",
    description: "Fast, premium air shipping"
  }
]

export function CourierAssignmentModal({
  userId,
  userName,
  isOpen,
  onClose
}: {
  userId: number
  userName: string
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeCouriers, setActiveCouriers] = useState<string[]>([])

  // Fetch current assignments when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true)

      axios
        .get(`/api/admin/users/${userId}/couriers`)
        .then((res) => {
          // Default to all selected if none configured yet
          if (res.data.couriers && res.data.couriers.length > 0) {
            setActiveCouriers(res.data.couriers)
          } else {
            setActiveCouriers(AVAILABLE_COURIERS.map((c) => c.id))
          }
        })
        .catch((err) => {
          console.error(err)
          toast.error("Failed to load courier settings")
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, userId])

  const toggleCourier = (courierId: string) => {
    setActiveCouriers((prev) =>
      prev.includes(courierId)
        ? prev.filter((id) => id !== courierId)
        : [...prev, courierId]
    )
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      await axios.post(`/api/admin/users/${userId}/couriers`, {
        couriers: activeCouriers
      })

      toast.success("Courier assignments saved successfully!")
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save assignments")
    } finally {
      setSaving(false)
    }
  }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Courier Access
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Manage which shipping services are available for {userName}.
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        AVAILABLE_COURIERS.map((courier) => (
                            <div key={courier.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="space-y-0.5">
                                    <h4 className="font-medium text-sm">{courier.name}</h4>
                                    <p className="text-xs text-muted-foreground">{courier.description}</p>
                                </div>
                                <Switch
                                    checked={activeCouriers.includes(courier.id)}
                                    onCheckedChange={() => toggleCourier(courier.id)}
                                />
                            </div>
                        ))
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}