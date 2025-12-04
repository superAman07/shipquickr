"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
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
import { ChevronRight, FileCheck, Home, Loader2, PackageSearch } from "lucide-react"; // Added Loader2, PackageSearch
import Link from "next/link";
import Image from "next/image";

interface Rate {
  courierName: string;
  serviceType?: string;
  weight: number;
  courierCharges: number;
  codCharges: number;
  totalPrice: number;
  image?: string;
  expectedDelivery?: string;
}

export default function RateCalculator() {
  const title = "Rate Calculator", subtitle = "Calculate shipping rates for your packages";
  const [form, setForm] = useState({
    paymentMode: "COD",
    pickupPincode: "",
    destinationPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    collectableValue: "",
    declaredValue: "",
  });
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
    setSubmitted(true);

    try {
      const payload = {
        ...form,
      };
      const res = await axios.post("/api/user/rate-calculator", payload);
      if (res.status === 200 && Array.isArray(res.data.rates)) {
        setRates(res.data.rates);
        if (res.data.rates.length === 0) {
          setError("No shipping rates found for the given details.");
        }
      } else {
        setError(res.data.error || "Could not fetch rates. Please check details.");
      }
    } catch (err: any) {
      console.error("Rate Calc Error:", err);

      if (err.response?.status === 404) {
        setError("No shipping rates found for the given details.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to fetch rates. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getCourierLogo = (courierName: string): string | null => {
    const nameLower = courierName.toLowerCase();
    if (nameLower.includes("ecom express")) {
      return "/ecom-express.png";
    }
    if (nameLower.includes("xpressbees")) {
      return "/xpressbees.png";
    }
    return null;
  };


  return (
    <>
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
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

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8 px-2 md:px-4">

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-md w-full lg:w-1/2 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
            <Select
              value={form.paymentMode}
              onValueChange={handleSelect}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Pincode</label>
              <Input
                name="pickupPincode"
                value={form.pickupPincode}
                onChange={handleChange}
                pattern="\d{6}"
                title="Enter a 6-digit pincode"
                required
                disabled={loading}
                placeholder="e.g. 110001"
                className="bg-blue-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination Pincode</label>
              <Input
                name="destinationPincode"
                value={form.destinationPincode}
                onChange={handleChange}
                pattern="\d{6}"
                title="Enter a 6-digit pincode"
                required
                disabled={loading}
                placeholder="e.g. 400001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
              <Input
                name="weight"
                value={form.weight}
                onChange={handleChange}
                type="number"
                min="0.01"
                step="0.01"
                required
                disabled={loading}
                placeholder="e.g. 0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dimensions (L×W×H cm)</label>
              <div className="flex gap-2">
                <Input name="length" value={form.length} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="L" />
                <Input name="width" value={form.width} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="W" />
                <Input name="height" value={form.height} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="H" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Declared Value (₹)</label>
              <Input
                name="declaredValue"
                value={form.declaredValue}
                onChange={handleChange}
                type="number"
                min="0"
                required
                disabled={loading}
                placeholder="Value of goods"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Collectable Value (₹)</label>
              <Input
                name="collectableValue"
                value={form.collectableValue}
                onChange={handleChange}
                type="number"
                min="0"
                required={form.paymentMode === "COD"}
                disabled={loading || form.paymentMode !== "COD"}
                placeholder={form.paymentMode === "COD" ? "Amount to collect" : "Not applicable"}
              />
            </div>
          </div>

          {error && !loading && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Checking Rates..." : "Check Price"}
          </Button>
        </form>

        <div className="w-full lg:w-1/2 space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md flex flex-col lg:max-h-[405px]">
          <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-md sm:text-xl font-semibold text-[#495057] dark:text-gray-200">Shipping Rates</h2>
          </div>
          <div className="flex-grow overflow-y-auto p-2 sm:p-3 space-y-4 hide-scrollbar">
            {loading && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Fetching rates...</p>
              </Card>
            )}

            {!loading && rates.length === 0 && submitted && !error && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 text-center">
                <PackageSearch className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No rates found for the entered details.</p>
              </Card>
            )}
            {!loading && !submitted && rates.length === 0 && !error && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 text-center">
                <PackageSearch className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Fill the form to see shipping rates.</p>
              </Card>
            )}

            {!loading && error && rates.length === 0 && (
              <Card className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3 text-center">
                <PackageSearch className="mx-auto h-8 w-8 text-red-500 dark:text-red-400" />
                <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">Error</p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
              </Card>
            )}

            {!loading && rates.length > 0 && rates.map((rate, idx) => {
              const logo = rate.image || getCourierLogo(rate.courierName);
              return (
                <Card key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <CardContent className="p-3 grid grid-cols-2 sm:grid-cols-6 gap-x-3 gap-y-2 items-center">                    <div className="col-span-2 sm:col-span-1 flex flex-col items-start">
                      {logo && (
                        <div className="relative h-16 w-16 rounded-[2px]">
                          {/* Use img tag for external URLs to avoid Next.js config issues, Image for local */}
                          {logo.startsWith("http") ? (
                             <img src={logo} alt={rate.courierName} className="h-full w-full object-contain" />
                          ) : (
                             <Image src={logo} alt={`${rate.courierName} logo`} layout="fill" objectFit="contain" />
                          )}
                        </div>
                      )}
                      {!logo && (
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{rate.courierName}</span>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white ml-3">{rate.serviceType || 'Standard'}</span>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Weight</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rate.weight.toFixed(2)} kg</p>
                    </div>

                    <div className="text-left hidden sm:block">
                      <p className="text-xs text-gray-500 dark:text-gray-400">ETD</p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {rate.expectedDelivery || "3-5 Days"}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Courier Charges</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">₹{rate.courierCharges.toFixed(2)}</p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 dark:text-gray-400">COD Charges</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">₹{rate.codCharges.toFixed(2)}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Price</p>
                      <p className="text-base font-bold text-blue-700 dark:text-blue-400">₹{rate.totalPrice.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}