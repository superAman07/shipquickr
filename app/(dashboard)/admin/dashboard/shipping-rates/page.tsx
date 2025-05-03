"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { toast } from "react-toastify"

export default function ShippingRates() {
  const [courierChargesType, setCourierChargesType] = useState("percentage")
  const [courierChargesAmount, setCourierChargesAmount] = useState("")
  const [codChargesType, setCodChargesType] = useState("percentage")
  const [codChargesAmount, setCodChargesAmount] = useState("")
  useEffect(()=>{
    const fetchShippingRates = async () => {
      try {
        const response = await axios.get("/api/admin/shipping-rates")
        const data = response.data
        setCourierChargesType(data.courierChargesType)
        setCourierChargesAmount(data.courierChargesAmount)
        setCodChargesType(data.codChargesType)
        setCodChargesAmount(data.codChargesAmount)
      } catch (error) {
        console.error("Error fetching shipping rates:", error)
      }
    }
    fetchShippingRates()
  },[])

  const handleSubmit= async ()=>{
    try {
        await axios.post("/api/admin/shipping-rates",{
            courierChargesType,
            courierChargesAmount: parseFloat(courierChargesAmount),
            codChargesType,
            codChargesAmount: parseFloat(codChargesAmount),
        })
        toast.success("Shipping rates updated successfully")
    }catch(error){
        console.error(error)
        toast.error("Failed to update shipping rates")
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background dark:bg-background">
      <div className="bg-purple-900 dark:bg-purple-950 p-6 text-white rounded-2xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M3 9H21M7 3V5M17 3V5M6 13H8M11 13H13M16 13H18M6 17H8M11 17H13M16 17H18M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Shipping Rates
          </h1>
          <p className="text-sm text-white/80">Manage your shipping and COD charges</p>
          <div className="flex items-center gap-1 text-sm mt-2">
            <Link href="/admin/dashboard" className="text-white/70 hover:text-white flex items-center">
              <Home className="h-3.5 w-3.5 mr-1" />
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-white/50" />
            <span>Shipping Rates</span>
          </div>
        </div>
      </div>
 
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="courier-charges-type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Courier Charges Type
              </label>
              <Select value={courierChargesType} onValueChange={setCourierChargesType}>
                <SelectTrigger id="courier-charges-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="courier-charges-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Courier Charges Amount
              </label>
              <Input
                id="courier-charges-amount"
                type="number"
                value={courierChargesAmount}
                onChange={(e) => setCourierChargesAmount(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cod-charges-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                COD Charges Type
              </label>
              <Select value={codChargesType} onValueChange={setCodChargesType}>
                <SelectTrigger id="cod-charges-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cod-charges-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                COD Charges Amount
              </label>
              <Input
                id="cod-charges-amount"
                type="number"
                value={codChargesAmount}
                onChange={(e) => setCodChargesAmount(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white">Update</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
