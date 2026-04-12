"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ChevronRight,
  Loader2,
  MapPin,
  Zap,
  Star,
  TrendingDown,
} from "lucide-react";
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

const EmptyStateIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mb-2 opacity-90 drop-shadow-sm"
  >
    <ellipse cx="120" cy="190" rx="90" ry="12" fill="#EEF2FF" />
    <path
      d="M70 60 Q 80 40 100 45 Q 110 30 130 40 Q 150 35 160 55 Z"
      fill="#EEF2FF"
      opacity="0.6"
    />

    <path d="M120 160 L180 130 L180 80 L120 110 Z" fill="#C7D2FE" />
    <path d="M60 130 L120 160 L120 110 L60 80 Z" fill="#818CF8" />
    <path d="M120 110 L180 80 L120 50 L60 80 Z" fill="#E0E7FF" />

    <path d="M105 87 L135 72 L130 69 L100 84 Z" fill="#6366F1" opacity="0.8" />
    <path d="M60 82 L120 112 L120 120 L60 90 Z" fill="#6366F1" opacity="0.1" />

    <circle cx="50" cy="110" r="5" fill="#FDE68A" />
    <circle cx="190" cy="90" r="4" fill="#FDE68A" />
    <circle cx="160" cy="170" r="3" fill="#FDE68A" />

    <path
      d="M40 160 L20 160 M50 175 L35 175"
      stroke="#CBD5E1"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.5"
    />

    <path d="M160 50 L190 50 L200 70 L190 90 L160 90 Z" fill="#FBBF24" />
    <circle cx="170" cy="70" r="3" fill="#FFF" />
  </svg>
);

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
  const [pickupLocation, setPickupLocation] = useState("");
  const [destLocation, setDestLocation] = useState("");

  const validatePincode = async (
    pincode: string,
    setLocation: (loc: string) => void
  ) => {
    if (pincode.length === 6) {
      try {
        const res = await axios.get(
          `https://api.postalpincode.in/pincode/${pincode}`
        );

        if (
          res.data?.[0]?.Status === "Success" &&
          res.data[0].PostOffice?.length > 0
        ) {
          setLocation(
            `${res.data[0].PostOffice[0].District}, ${res.data[0].PostOffice[0].State}`
          );
          return;
        }
      } catch {}

      try {
        const res2 = await axios.get(
          `https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&filters%5Bpincode%5D=${pincode}`
        );

        if (res2.data?.records?.length > 0) {
          const rec = res2.data.records[0];
          setLocation(
            `${rec.districtname || rec.officename || ""}, ${rec.statename || ""}`
          );
          return;
        }
      } catch {}

      setLocation("");
    } else {
      setLocation("");
    }
  };

  useEffect(() => {
    validatePincode(form.pickupPincode, setPickupLocation);
  }, [form.pickupPincode]);

  useEffect(() => {
    validatePincode(form.destinationPincode, setDestLocation);
  }, [form.destinationPincode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRates([]);
    setSubmitted(true);

    try {
      const res = await axios.post("/api/user/rate-calculator", form);

      if (res.status === 200 && Array.isArray(res.data.rates)) {
        setRates(res.data.rates);

        if (res.data.rates.length === 0) {
          setError("No shipping rates found for the given details.");
        }
      } else {
        setError(
          res.data.error || "Could not fetch rates. Please check details."
        );
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("No shipping rates found.");
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
    if (nameLower.includes("ecom express")) return "/ecom-express.png";
    if (nameLower.includes("xpressbees")) return "/xpressbees.png";
    if (nameLower.includes("shadowfax")) return "/shadowfax.png";
    if (nameLower.includes("delhivery")) return "/delhivery.png";
    return null;
  };

  const normalizeServiceType = (serviceType?: string): string => {
    if (!serviceType) return "Surface";

    const lower = serviceType.toLowerCase();
    if (lower.includes("express") || lower.includes("air")) return "Air";
    if (lower.includes("surface")) return "Surface";
    return serviceType;
  };

  const parseTransitDays = (delivery?: string): number => {
    if (!delivery) return 99;
    const match = delivery.match(/(\d+)/);
    return match ? parseInt(match[1]) : 99;
  };

  const getBadges = (sortedRates: Rate[]) => {
    if (sortedRates.length === 0) return {};

    const badges: Record<
      number,
      { label: string; color: string; icon: React.ReactNode }
    > = {};

    const cheapestIdx = 0;
    badges[cheapestIdx] = {
      label: "Cheapest",
      color: "bg-emerald-500",
      icon: <TrendingDown className="h-3 w-3" />,
    };

    let fastestIdx = 0;
    let minDays = parseTransitDays(sortedRates[0].expectedDelivery);

    sortedRates.forEach((r, i) => {
      const days = parseTransitDays(r.expectedDelivery);
      if (days < minDays) {
        minDays = days;
        fastestIdx = i;
      }
    });

    if (fastestIdx !== cheapestIdx) {
      badges[fastestIdx] = {
        label: "Fastest",
        color: "bg-indigo-600",
        icon: <Zap className="h-3 w-3" />,
      };
    }

    if (sortedRates.length >= 3) {
      const recommendedIdx = Math.floor(sortedRates.length / 2);
      if (!badges[recommendedIdx]) {
        badges[recommendedIdx] = {
          label: "Recommended",
          color: "bg-amber-500",
          icon: <Star className="h-3 w-3" />,
        };
      }
    }

    return badges;
  };

  const sortedRates = [...rates].sort((a, b) => a.totalPrice - b.totalPrice);
  const badges = getBadges(sortedRates);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50/50 dark:bg-[#0a0c1a]">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-500/[0.04] blur-3xl dark:bg-indigo-500/[0.08]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/[0.03] blur-3xl dark:bg-purple-500/[0.06]" />

      <main className="relative z-10 p-4 lg:p-8">
        <div className="mx-auto max-w-full">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="min-w-0">
              <h2 className="cursor-default text-2xl font-black tracking-tight text-[#0a0c37] drop-shadow-sm transition-all hover:translate-x-1 dark:text-white uppercase">
                Rate Calculator
              </h2>

              <div className="mt-1 flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-gray-400">
                <Link
                  href="/user/dashboard"
                  className="cursor-pointer transition-colors hover:text-[#0a0c37] dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="cursor-default text-[#0a0c37] dark:text-indigo-400">
                  Rate Calculator
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <form
              onSubmit={handleSubmit}
              className="w-full overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827] lg:w-[480px] lg:shrink-0"
            >
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Payment Mode
                  </label>

                  <div className="flex gap-4">
                    <label
                      className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                        form.paymentMode === "COD"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : "border-gray-200 bg-gray-50/30 text-gray-400 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value="COD"
                        checked={form.paymentMode === "COD"}
                        onChange={() =>
                          setForm((prev) => ({ ...prev, paymentMode: "COD" }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
                          form.paymentMode === "COD"
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {form.paymentMode === "COD" && (
                          <div className="h-1.5 w-1.5 rounded-sm bg-white" />
                        )}
                      </div>
                      COD
                    </label>

                    <label
                      className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                        form.paymentMode === "ppd"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : "border-gray-200 bg-gray-50/30 text-gray-400 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value="ppd"
                        checked={form.paymentMode === "ppd"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            paymentMode: "ppd",
                            collectableValue: "",
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
                          form.paymentMode === "ppd"
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {form.paymentMode === "ppd" && (
                          <div className="h-1.5 w-1.5 rounded-sm bg-white" />
                        )}
                      </div>
                      Prepaid
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <MapPin className="h-3 w-3" /> Pickup Pincode
                    </label>
                    <input
                      name="pickupPincode"
                      value={form.pickupPincode}
                      onChange={handleChange}
                      pattern="\d{6}"
                      required
                      disabled={loading}
                      placeholder="110001"
                      className="h-11 w-full rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-bold text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    {pickupLocation && (
                      <p className="mt-1.5 text-[10px] font-bold tracking-wide text-emerald-600">
                        {pickupLocation}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <MapPin className="h-3 w-3" /> Dest.Pincode
                    </label>
                    <input
                      name="destinationPincode"
                      value={form.destinationPincode}
                      onChange={handleChange}
                      pattern="\d{6}"
                      required
                      disabled={loading}
                      placeholder="226101"
                      className="h-11 w-full rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-bold text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    {destLocation && (
                      <p className="mt-1.5 text-[10px] font-bold tracking-wide text-emerald-600">
                        {destLocation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Weight
                    </label>
                    <div className="flex overflow-hidden rounded-sm border border-gray-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900">
                      <input
                        name="weight"
                        value={form.weight}
                        onChange={handleChange}
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        disabled={loading}
                        placeholder="0.5"
                        className="h-11 min-w-0 flex-1 bg-transparent px-4 text-[13px] font-bold text-gray-900 outline-none dark:text-white"
                      />
                      <span className="flex h-11 w-12 shrink-0 items-center justify-center border-l border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                        KG
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Dimensions
                    </label>
                    <div className="flex overflow-hidden rounded-sm border border-gray-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900">
                      <input
                        name="length"
                        value={form.length}
                        onChange={handleChange}
                        type="number"
                        min="1"
                        required
                        disabled={loading}
                        placeholder="L"
                        className="h-11 w-0 flex-1 min-w-0 border-r border-gray-200 bg-transparent px-1 text-center text-[12px] font-bold text-gray-900 outline-none dark:border-gray-700 dark:text-white"
                      />
                      <input
                        name="width"
                        value={form.width}
                        onChange={handleChange}
                        type="number"
                        min="1"
                        required
                        disabled={loading}
                        placeholder="W"
                        className="h-11 w-0 flex-1 min-w-0 border-r border-gray-200 bg-transparent px-1 text-center text-[12px] font-bold text-gray-900 outline-none dark:border-gray-700 dark:text-white"
                      />
                      <input
                        name="height"
                        value={form.height}
                        onChange={handleChange}
                        type="number"
                        min="1"
                        required
                        disabled={loading}
                        placeholder="H"
                        className="h-11 w-0 flex-1 min-w-0 bg-transparent px-1 text-center text-[12px] font-bold text-gray-900 outline-none dark:text-white"
                      />
                      <span className="flex h-11 w-10 shrink-0 items-center justify-center border-l border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                        CM
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid gap-5 ${
                    form.paymentMode === "COD" ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Declared Value
                    </label>
                    <div className="flex overflow-hidden rounded-sm border border-gray-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900">
                      <span className="flex h-11 w-10 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50 text-sm font-black text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                        ₹
                      </span>
                      <input
                        name="declaredValue"
                        value={form.declaredValue}
                        onChange={handleChange}
                        type="number"
                        min="0"
                        required
                        disabled={loading}
                        placeholder="5000"
                        className="h-11 min-w-0 flex-1 bg-transparent px-4 text-[13px] font-bold text-gray-900 outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  {form.paymentMode === "COD" && (
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Collectable Value
                      </label>
                      <div className="flex overflow-hidden rounded-sm border border-gray-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900">
                        <span className="flex h-11 w-10 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50 text-sm font-black text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                          ₹
                        </span>
                        <input
                          name="collectableValue"
                          value={form.collectableValue}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          required
                          disabled={loading}
                          placeholder="4000"
                          className="h-11 min-w-0 flex-1 bg-transparent px-4 text-[13px] font-bold text-gray-900 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && !loading && (
                  <p className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-[11px] font-bold text-rose-600 dark:border-rose-800 dark:bg-rose-900/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-indigo-600 py-4 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Fetching Rates..." : "Check Prices"}
                </button>
              </div>
            </form>

            <div className="flex h-[470px] flex-1 flex-col overflow-hidden rounded-md border border-[#0a0c37] bg-[#0a0c37] shadow-xl transition-all">
              <div className="shrink-0 px-5 pb-3 pt-4">
                {submitted && rates.length > 0 ? (
                  <div>
                    <p className="text-center text-[14px] font-normal leading-relaxed text-white sm:text-[15px]">
                      Rates from shipping a{" "}
                      {form.paymentMode === "COD" ? "COD" : "Prepaid"} packet
                      from{" "}
                      <span className="font-bold underline underline-offset-4">
                        {form.pickupPincode}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold underline underline-offset-4">
                        {form.destinationPincode}
                      </span>{" "}
                      with a declared value of Rs.{form.declaredValue}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-white">
                      Available Courier Rates
                    </h3>
                    <p className="mt-1 text-[11px] font-medium text-indigo-300">
                      Enter details and hit Check Price to unlock live rates
                    </p>
                  </div>
                )}
              </div>

              <div className="mx-1 mb-1 flex-1 overflow-y-auto rounded-sm bg-white p-2 shadow-inner dark:bg-[#111827] sm:p-3">
                {loading && (
                  <div className="flex h-full flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500 opacity-20 blur-xl" />
                      <Loader2 className="relative z-10 h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                    <p className="animate-pulse text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Accessing courier networks...
                    </p>
                  </div>
                )}

                {!loading && rates.length === 0 && !error && (
                  <div className="flex h-full flex-col items-center justify-center p-4">
                    <EmptyStateIllustration />
                    <h4 className="mt-4 text-[14px] font-black uppercase tracking-widest text-[#0a0c37] dark:text-white">
                      No Shipment Data
                    </h4>
                    <p className="mt-2 max-w-[240px] text-center text-[11.5px] font-medium leading-relaxed text-gray-400">
                      Enter your shipment origin, destination, and package details
                      to see live calculated rates.
                    </p>
                  </div>
                )}

                {!loading &&
                  sortedRates.map((rate, idx) => {
                    const logo = rate.image || getCourierLogo(rate.courierName);
                    const serviceType = normalizeServiceType(rate.serviceType);
                    const badge = badges[idx];

                    return (
                      <div
                        key={idx}
                        className="group relative mb-3 rounded-md border border-gray-200 bg-white p-4 transition-all hover:border-indigo-400 dark:border-gray-800 dark:bg-[#111827] dark:hover:border-indigo-600"
                      >
                        {badge && (
                          <div
                            className={`absolute -top-2.5 right-4 z-10 flex items-center gap-1 rounded-sm px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${badge.color}`}
                          >
                            {badge.icon} {badge.label}
                          </div>
                        )}

                        <div className="hidden items-center gap-4 sm:flex">
                          <div className="flex w-[130px] shrink-0 flex-col items-center border-r border-gray-100 pr-5 dark:border-gray-800">
                            {logo ? (
                              <div className="relative mb-2 h-7 w-24">
                                <Image
                                  src={logo}
                                  alt={rate.courierName}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <span className="mb-1.5 text-[11px] font-black uppercase text-gray-700 dark:text-gray-200">
                                {rate.courierName}
                              </span>
                            )}

                            <span
                              className={`rounded-sm border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                                serviceType === "Air"
                                  ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/30"
                                  : "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30"
                              }`}
                            >
                              {serviceType}
                            </span>
                          </div>

                          <div className="grid flex-1 grid-cols-3 gap-2 px-2">
                            <div className="text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                Weight
                              </p>
                              <p className="mt-1 text-[13px] font-bold text-gray-800 dark:text-gray-200">
                                {rate.weight.toFixed(1)}{" "}
                                <span className="text-[10px] text-gray-400">Kg</span>
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                Transit
                              </p>
                              <p className="mt-1 text-[13px] font-bold text-emerald-600">
                                {rate.expectedDelivery || "3-5 Days"}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                Freight
                              </p>
                              <p className="mt-1 text-[13px] font-bold text-gray-600 dark:text-gray-300">
                                ₹{rate.courierCharges.toFixed(0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex min-w-[95px] shrink-0 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-xl font-black tracking-tight text-[#0a0c37] dark:text-white">
                              ₹{rate.totalPrice.toFixed(0)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {logo ? (
                                <div className="relative h-7 w-20">
                                  <Image
                                    src={logo}
                                    alt={rate.courierName}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <span className="text-[11px] font-black uppercase text-gray-700 dark:text-gray-200">
                                  {rate.courierName}
                                </span>
                              )}

                              <span
                                className={`rounded-sm border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                                  serviceType === "Air"
                                    ? "border-orange-200 bg-orange-50 text-orange-600"
                                    : "border-blue-200 bg-blue-50 text-blue-600"
                                }`}
                              >
                                {serviceType}
                              </span>
                            </div>

                            <div className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                              <p className="text-lg font-black tracking-tight text-[#0a0c37] dark:text-white">
                                ₹{rate.totalPrice.toFixed(0)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                            <div className="text-center">
                              <p className="text-[8px] font-black uppercase text-gray-400">
                                Weight
                              </p>
                              <p className="mt-1 text-[12px] font-bold text-gray-700 dark:text-gray-300">
                                {rate.weight.toFixed(1)} Kg
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-[8px] font-black uppercase text-gray-400">
                                Transit
                              </p>
                              <p className="mt-1 text-[12px] font-bold text-emerald-600">
                                {rate.expectedDelivery || "3-5 Days"}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-[8px] font-black uppercase text-gray-400">
                                Freight
                              </p>
                              <p className="mt-1 text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                ₹{rate.courierCharges.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}