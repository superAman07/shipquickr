"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { ChevronRight, FileCheck, Home } from "lucide-react";
import Link from "next/link";

export default function RateCalculator() {
  const title = "Rate Calculator", subtitle = "Calculate shipping rates for your packages"
  const [form, setForm] = useState({
    paymentMode: "COD",
    pickupPincode: "",
    destinationPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    collectableValue: "",
  });
  const [rates, setRates] = useState<{ courierName: string; serviceType?: string; weight: number; courierCharges: number; codCharges: number; totalPrice: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleSelect = (value: string) => {
    setForm((prev) => ({ ...prev, paymentMode: value }));
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRates([]);

    try {
      const res = await axios.post("/api/common/rate-calculator", form);
      if (res.status === 200 && Array.isArray(res.data.rates)) {
        setRates(res.data.rates);
      } else {
        setError(res.data.error || "No rates returned.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch rates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
       <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
         <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
           <div className="flex flex-col gap-1 sm:gap-2">
             <div className="flex items-center gap-2 dark:text-amber-50">
               <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
               <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">{title}</h1>
             </div>
             {subtitle && (
              <p className="text-xs sm:text-sm text-primary-foreground/80 dark:text-amber-50/90">{subtitle}</p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
            <Link
              href="/user/dashboard"
              className="flex items-center hover:text-gray-300 transition-colors min-w-0 shrink-0"
            >
              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate">Dashboard</span>
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
            <span className="font-medium truncate">Rate Calculator</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow w-full lg:w-1/2 space-y-6"
        >
          <div>
            <label className="block mb-1">Payment Mode</label>
            <Select
              value={form.paymentMode}
              onValueChange={handleSelect}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COD">COD</SelectItem>
                <SelectItem value="ppd">Prepaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Pickup Pincode</label>
              <Input
                name="pickupPincode"
                value={form.pickupPincode}
                onChange={handleChange}
                pattern="\d{6}"
                title="Enter a 6-digit pincode"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-1">Destination Pincode</label>
              <Input
                name="destinationPincode"
                value={form.destinationPincode}
                onChange={handleChange}
                pattern="\d{6}"
                title="Enter a 6-digit pincode"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Weight (kg)</label>
              <Input
                name="weight"
                value={form.weight}
                onChange={handleChange}
                type="number"
                min="0.1"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-1">Dimensions (L×W×H cm)</label>
              <div className="flex gap-2">
                <Input
                  name="length"
                  value={form.length}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  disabled={loading}
                  placeholder="L"
                />
                <Input
                  name="width"
                  value={form.width}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  disabled={loading}
                  placeholder="W"
                />
                <Input
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  disabled={loading}
                  placeholder="H"
                />
              </div>
            </div>
          </div>
          {form.paymentMode === "COD" && (
            <div>
              <label className="block mb-1">Collectable Value (₹)</label>
              <Input
                name="collectableValue"
                value={form.collectableValue}
                onChange={handleChange}
                type="number"
                min="0"
                required
                disabled={loading}
              />
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Checking rates..." : "Check Rates"}
          </Button>
        </form>
        <div className="w-full lg:w-1/2 space-y-4">
          <h2 className="text-2xl font-bold">Shipping Rates</h2>
          {!loading && rates.length === 0 && !error && (
            <p className="text-gray-500">No rates to display. Fill the form above.</p>
          )}

          {rates.map((rate, idx) => (
            <Card
              key={idx}
              className="flex flex-col md:flex-row justify-between p-4 bg-gray-100 dark:bg-gray-800 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold">{rate.courierName}</h3>
                {rate.serviceType && (
                  <p className="text-sm text-gray-600">{rate.serviceType}</p>
                )}
              </div>
              <div className="mt-2 md:mt-0 flex flex-col md:flex-row gap-4">
                <span>Weight: {rate.weight} kg</span>
                <span>Courier: ₹{rate.courierCharges}</span>
                <span>COD: ₹{rate.codCharges}</span>
                <span className="font-bold">Total: ₹{rate.totalPrice}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}