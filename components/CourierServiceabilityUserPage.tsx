"use client";

import axios from "axios";
import {
  ChevronRight,
  Home,
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

interface CourierInfo {
  courierName: string;
}

const COURIER_META: Record<
  string,
  { logo: string; color: string; bgColor: string; darkBgColor: string }
> = {
  shadowfax: {
    logo: "/shadowfax.png",
    color: "text-yellow-600",
    bgColor: "bg-white",
    darkBgColor: "dark:bg-gray-800",
  },
  "ecom express": {
    logo: "/ecom-express.png",
    color: "text-blue-600",
    bgColor: "bg-white",
    darkBgColor: "dark:bg-gray-800",
  },
  xpressbees: {
    logo: "/xpressbees.png",
    color: "text-purple-600",
    bgColor: "bg-white",
    darkBgColor: "dark:bg-gray-800",
  },
  delhivery: {
    logo: "/delhivery.png",
    color: "text-red-600",
    bgColor: "bg-white",
    darkBgColor: "dark:bg-gray-800",
  },
};

function getCourierMeta(name: string) {
  const key = name.toLowerCase();

  for (const [k, v] of Object.entries(COURIER_META)) {
    if (key.includes(k)) return v;
  }

  return {
    logo: "",
    color: "text-gray-600",
    bgColor: "bg-white",
    darkBgColor: "dark:bg-gray-800",
  };
}

export default function CourierServiceabilityUserPage() {
  const [sellerPincode, setSellerPincode] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [availableCouriers, setAvailableCouriers] = useState<CourierInfo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAvailableCouriers([]);
    setHasSearched(true);

    try {
      const response = await axios.post("/api/user/courier-serviceability", {
        pickupPincode: sellerPincode,
        destinationPincode: customerPincode,
      });

      const data = response.data;

      if (response.status === 200 && data.couriers) {
        if (data.couriers.length === 0) {
          setError(
            data.message || "No courier services found for the given pincodes."
          );
        } else {
          setAvailableCouriers(data.couriers);
        }
      } else {
        setError(
          data.error ||
            "Something went wrong. Please check pincodes and try again."
        );
      }
    } catch (err: any) {
      console.error("Error fetching courier serviceability:", err);

      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to fetch serviceability data. Ensure pincodes are valid.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSellerPincode("");
    setCustomerPincode("");
    setAvailableCouriers([]);
    setError("");
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-4 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Courier Serviceability
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-primary-foreground/80 dark:text-amber-50/90">
              Check which couriers can deliver between any two pincodes
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
            <Link
              href="/user/dashboard"
              className="flex items-center hover:text-gray-300 transition-colors"
            >
              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span>Dashboard</span>
            </Link>

            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />

            <span className="font-medium">Courier Serviceability</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 pb-8">
        {/* Search Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Seller Pincode */}
              <div className="space-y-2">
                <label
                  htmlFor="sellerPincode"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Pickup Pincode (Seller)
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="sellerPincode"
                    type="text"
                    value={sellerPincode}
                    onChange={(e) =>
                      setSellerPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter 6-digit pincode"
                    required
                    pattern="\d{6}"
                    title="Pincode must be 6 digits"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Customer Pincode */}
              <div className="space-y-2">
                <label
                  htmlFor="customerPincode"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Delivery Pincode (Customer)
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="customerPincode"
                    type="text"
                    value={customerPincode}
                    onChange={(e) =>
                      setCustomerPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter 6-digit pincode"
                    required
                    pattern="\d{6}"
                    title="Pincode must be 6 digits"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={
                  loading || sellerPincode.length !== 6 || customerPincode.length !== 6
                }
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer text-sm"
              >
                <Search className="h-4 w-4" />
                {loading ? "Checking..." : "Check Serviceability"}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all cursor-pointer text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-600 border-t-purple-600 animate-spin" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Checking all courier partners...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This may take a few seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && availableCouriers.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Available Couriers
                </h2>
              </div>

              <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                {availableCouriers.length} courier
                {availableCouriers.length > 1 ? "s" : ""} found
              </span>
            </div>

            {/* Route Info */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {sellerPincode}
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {customerPincode}
              </span>
            </div>

            {/* Courier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableCouriers.map((courier, index) => {
                const meta = getCourierMeta(courier.courierName);

                return (
                  <div
                    key={index}
                    className={`${meta.bgColor} ${meta.darkBgColor} rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-0.5`}
                  >
                    {meta.logo && (
                      <div className="w-full h-20 relative mb-4">
                        <Image
                          src={meta.logo}
                          alt={`${courier.courierName} logo`}
                          fill
                          className="object-contain"
                          sizes="120px"
                        />
                      </div>
                    )}

                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {courier.courierName}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Serviceable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && hasSearched && availableCouriers.length === 0 && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <XCircle className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No couriers available for this route
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Try a different pincode combination
              </p>
            </div>
          </div>
        )}

        {/* Initial Empty State */}
        {!loading && !hasSearched && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Search className="h-7 w-7 text-purple-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Enter pickup and delivery pincodes to check serviceability
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
                We&apos;ll check all available courier partners, Delhivery,
                Xpressbees, Shadowfax, and Ecom Express, to show which ones can
                service your route.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}