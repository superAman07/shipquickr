"use client"

import { useState } from "react"
import { Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function RateCalculator() {
  const [weight, setWeight] = useState("")
  const [distance, setDistance] = useState("")
  const [rate, setRate] = useState<number | null>(null)

  const calculateRate = () => {
    // This is a placeholder calculation
    const calculatedRate = Number.parseFloat(weight) * 10 + Number.parseFloat(distance) * 2
    setRate(calculatedRate)
  }

  return (
    <div className="hidden md:flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Rate Calculator
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Calculate Shipping Rate</h4>
              <p className="text-sm text-muted-foreground">Enter package details to calculate shipping rate</p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  className="col-span-2"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  className="col-span-2"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Enter distance"
                />
              </div>
            </div>
            <Button onClick={calculateRate}>Calculate</Button>
            {rate !== null && (
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">Estimated Rate: ₹{rate.toFixed(2)}</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Mobile version - simplified */}
      <div className="md:hidden">
        <Button variant="outline" size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate
        </Button>
      </div>
    </div>
  )
}
