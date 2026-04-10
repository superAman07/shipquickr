"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { ChevronRight, FileCheck, Home, Loader2, PackageSearch, Scale, Clock, IndianRupee, MapPin } from "lucide-react";
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

  // Live Pincode Validation States
  const [pickupLocation, setPickupLocation] = useState("");
  const [destLocation, setDestLocation] = useState("");

  const validatePincode = async (pincode: string, setLocation: (loc: string) => void) => {
    if (pincode.length === 6) {
      try {
        const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        if (res.data?.[0]?.Status === "Success" && res.data[0].PostOffice?.length > 0) {
          setLocation(`${res.data[0].PostOffice[0].District}, ${res.data[0].PostOffice[0].State}`);
          return;
        }
      } catch { }

      // Fallback: try data.gov.in
      try {
        const res2 = await axios.get(`https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&filters%5Bpincode%5D=${pincode}`);
        if (res2.data?.records?.length > 0) {
          const rec = res2.data.records[0];
          setLocation(`${rec.districtname || rec.officename || ""}, ${rec.statename || ""}`);
          return;
        }
      } catch { }

      // Both failed — still allow submission
      setLocation("");
    } else {
      setLocation("");
    }
  };

  useEffect(() => { validatePincode(form.pickupPincode, setPickupLocation); }, [form.pickupPincode]);
  useEffect(() => { validatePincode(form.destinationPincode, setDestLocation); }, [form.destinationPincode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (value: string) => {
    setForm((prev) => ({ ...prev, paymentMode: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // No longer block submission for unrecognized pincodes

    setLoading(true);
    setError(null);
    setRates([]);
    setSubmitted(true);

    try {
      const res = await axios.post("/api/user/rate-calculator", form);
      if (res.status === 200 && Array.isArray(res.data.rates)) {
        setRates(res.data.rates);
        if (res.data.rates.length === 0) setError("No shipping rates found format the given details.");
      } else {
        setError(res.data.error || "Could not fetch rates. Please check details.");
      }
    } catch (err: any) {
      if (err.response?.status === 404) setError("No shipping rates found.");
      else if (err.response?.data?.error) setError(err.response.data.error);
      else setError("Failed to fetch rates. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getCourierLogo = (courierName: string): string | null => {
    const nameLower = courierName.toLowerCase();
    if (nameLower.includes("ecom express")) return "/ecom-express.png";
    if (nameLower.includes("xpressbees")) return "/xpressbees.png";
    if (nameLower.includes("shadowfax")) return "/shadowfax.png";
    if (nameLower.includes("delhivery")) return "/delhivery.png";
    return null;
  };

  return (
    <>
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-2 dark:text-amber-50">
              <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">Rate Calculator</h1>
            </div>
            <p className="text-xs sm:text-sm text-primary-foreground/80 dark:text-amber-50/90">Instantly gauge delivery speeds and costs</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
            <Link href="/user/dashboard" className="flex items-center hover:text-gray-300 transition-colors shrink-0">
              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
            <span className="font-medium truncate">Rate Calculator</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8 px-2 md:px-4">

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl w-full lg:w-1/2 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PackageSearch className="w-5 h-5 text-indigo-600" /> Shipment Details
            </h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">Payment Mode</label>
            <Select value={form.paymentMode} onValueChange={handleSelect} disabled={loading}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-indigo-500 rounded-lg">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COD" className="font-medium text-emerald-700">Cash on Delivery (COD)</SelectItem>
                <SelectItem value="ppd" className="font-medium text-blue-700">Prepaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Pickup Pincode</label>
              <Input name="pickupPincode" value={form.pickupPincode} onChange={handleChange} pattern="\d{6}" required disabled={loading} placeholder="e.g. 110001" className="bg-slate-50 border-slate-200 rounded-lg" />
              {pickupLocation && (
                <p className={`text-[11px] mt-1.5 font-bold tracking-wide ${pickupLocation === 'Invalid Pincode' ? 'text-red-500' : 'text-emerald-600'}`}>{pickupLocation}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Delivery Pincode</label>
              <Input name="destinationPincode" value={form.destinationPincode} onChange={handleChange} pattern="\d{6}" required disabled={loading} placeholder="e.g. 400001" className="bg-slate-50 border-slate-200 rounded-lg" />
              {destLocation && (
                <p className={`text-[11px] mt-1.5 font-bold tracking-wide ${destLocation === 'Invalid Pincode' ? 'text-red-500' : 'text-emerald-600'}`}>{destLocation}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1"><Scale className="w-3.5 h-3.5"/> Weight (kg)</label>
              <Input name="weight" value={form.weight} onChange={handleChange} type="number" min="0.01" step="0.01" required disabled={loading} placeholder="0.5" className="bg-slate-50 border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Dimensions (cm)</label>
              <div className="flex gap-2">
                <Input name="length" value={form.length} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="L" className="bg-slate-50 border-slate-200 rounded-lg text-center" />
                <Input name="width" value={form.width} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="W" className="bg-slate-50 border-slate-200 rounded-lg text-center" />
                <Input name="height" value={form.height} onChange={handleChange} type="number" min="1" required disabled={loading} placeholder="H" className="bg-slate-50 border-slate-200 rounded-lg text-center" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
               <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Declared Value (₹)</label>
               <Input name="declaredValue" value={form.declaredValue} onChange={handleChange} type="number" min="0" required disabled={loading} placeholder="Goods value" className="bg-slate-50 border-slate-200 rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Collectable Value (₹)</label>
               <Input name="collectableValue" value={form.collectableValue} onChange={handleChange} type="number" min="0" required={form.paymentMode === "COD"} disabled={loading || form.paymentMode !== "COD"} placeholder={form.paymentMode === "COD" ? "To collect" : "N/A"} className="bg-slate-50 border-slate-200 rounded-lg" />
            </div>
          </div>

          {error && !loading && <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full text-md font-bold mt-4 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {loading ? "Calculating Best Rates..." : "Check Prices"}
          </Button>
        </form>

        {/* Premium Results Container */}
        <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 dark:bg-gray-900 border border-slate-200/60 dark:border-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden lg:sticky lg:top-8 lg:h-[calc(100vh-140px)] transition-all">
          
          {/* Header Section */}
          <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md z-10 shrink-0">
            <h2 className="text-xl font-extrabold bg-linear-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2.5">
              Available Courier Rates
              {rates.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
                  {rates.length} Options
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 opacity-90">
              Scroll to compare delivery speeds and freight charges
            </p>
          </div>

          {/* Scrollable List Section */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {loading && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                   <Loader2 className="h-12 w-12 animate-spin text-indigo-600 relative z-10" />
                </div>
                <p className="text-sm font-bold tracking-wide text-slate-600 dark:text-slate-400 animate-pulse">
                  Querying Partner Networks...
                </p>
              </div>
            )}

            {!loading && rates.length === 0 && !error && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-60 transition-opacity hover:opacity-100">
                <PackageSearch className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-5" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center max-w-[250px] leading-relaxed">
                  Enter your shipment details and hit check prices to unlock live rates!
                </p>
              </div>
            )}

            {!loading && rates.length > 0 && rates.sort((a,b) => a.totalPrice - b.totalPrice).map((rate, idx) => {
              const logo = rate.image || getCourierLogo(rate.courierName);
              const isExpress = rate.serviceType?.toLowerCase().includes('express') || rate.serviceType?.toLowerCase().includes('air');
              const isCheapest = idx === 0; // Since we sorted them by price
              
              return (
                <div key={idx} className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-1">
                  
                  {isCheapest && (
                    <div className="absolute -top-3 -right-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-md shadow-green-500/20 z-10 border border-white dark:border-gray-800">
                      Cheapest
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    
                    {/* Courier Identity */}
                    <div className="col-span-1 border-b pb-3 sm:pb-0 sm:border-b-0 sm:border-r border-slate-100 dark:border-gray-700 sm:col-span-3 flex flex-row sm:flex-col items-center sm:justify-center justify-between h-full pr-0 sm:pr-4">
                      {logo ? (
                        <div className="relative h-10 w-24 sm:w-28 mb-0 sm:mb-2 transition-transform group-hover:scale-105">
                           <Image src={logo} alt={`${rate.courierName} logo`} layout="fill" objectFit="contain" />
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mb-0 sm:mb-2">{rate.courierName}</span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-sm ${isExpress ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'} border`}>
                        {rate.serviceType || 'Standard'}
                      </span>
                    </div>

                    {/* Meta Data */}
                    <div className="col-span-1 sm:col-span-6 grid grid-cols-3 gap-2 sm:gap-4 pl-0 sm:pl-2">
                       <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Weight</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{rate.weight.toFixed(2)} <span className="text-xs text-slate-500">kg</span></p>
                       </div>
                       <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Transit</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {rate.expectedDelivery || "3-5 Days"}
                          </p>
                       </div>
                       <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Freight</p>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">₹{rate.courierCharges.toFixed(2)}</p>
                       </div>
                    </div>

                    {/* Total Price Highlight */}
                    <div className="col-span-1 sm:col-span-3 flex sm:flex-col items-center justify-between sm:justify-center bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-800/30 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40">
                       <div className="flex flex-col">
                         <p className="text-[10px] font-bold text-indigo-400 sm:text-center uppercase tracking-widest">Total</p>
                         <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5 tracking-tight text-center">₹{rate.totalPrice.toFixed(0)}</p>
                       </div>
                       <div className="sm:hidden flex flex-col text-right">
                         <p className="text-[10px] text-slate-500 font-medium">Includes COD</p>
                         <p className="text-[11px] font-bold text-slate-700">₹{rate.codCharges.toFixed(2)}</p>
                       </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}