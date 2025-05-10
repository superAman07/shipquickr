'use client'
import Loading from "@/app/loading";
import axios from "axios";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react"; 



export default function CourierServiceabilityUserPage() {
  const [sellerPincode, setSellerPincode] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  interface Service {
    courierName: string;
    serviceType: string;
    services: Record<string, boolean>;
  }
  interface CourierInfo {
    courierName: string;
  }

  const [availableCouriers, setAvailableCouriers] = useState<CourierInfo[]>([]); // Changed state variable name and type
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCourierLogo = (courierName: string): string | null => {
    const nameLower = courierName.toLowerCase();
    if (nameLower.includes("shadowfax")) {
      return "/shadowfax.png"; 
    }
    if (nameLower.includes("ecom express")) {
      return "/ecom-express.png"; 
    }
    if (nameLower.includes("xpressbees")) {
      return "/xpressbees.png";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAvailableCouriers([]); 
    try {
      const response = await axios.post("/api/user/courier-serviceability", {
        pickupPincode: sellerPincode, 
        destinationPincode: customerPincode,
      });

      const data = response.data;
      if (response.status === 200 && data.couriers) {
        if (data.couriers.length === 0) {
          setError(data.message || "No courier services found for the given pincodes.");
        } else {
          setAvailableCouriers(data.couriers);
        }
      } else {
         setError(data.error || "Something went wrong. Please check pincodes and try again.");
      }
    } catch (err: any) {
        console.error("Error fetching courier serviceability:", err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else if (err.response?.data?.message) { 
          setError(err.response.data.message);
        }
        else {
          setError("Failed to fetch serviceability data. Ensure pincodes are valid.");
        }
      } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              <Home className="h-4 w-4" />
          </Link> 
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-700 dark:text-gray-200">Courier Serviceability</span>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Courier Serviceability</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-6"> 
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="sellerPincode">
            Seller&apos;s Pincode
          </label>
          <input
            id="sellerPincode"
            type="text"
            value={sellerPincode}
            onChange={(e) => setSellerPincode(e.target.value)}
            className="block w-full px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
            placeholder="Enter Seller's Pincode"
            required
            pattern="\d{6}"
            title="Pincode must be 6 digits"
          />
        </div>
        <div className="mb-6"> 
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="customerPincode">
            Customer's Pincode
          </label>
          <input
            id="customerPincode"
            type="text"
            value={customerPincode}
            onChange={(e) => setCustomerPincode(e.target.value)}
            className="block w-full px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
            placeholder="Enter Customer's Pincode"
            required
            pattern="\d{6}"
            title="Pincode must be 6 digits"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2 cursor-pointer leading-5 text-white transition-colors duration-200 transform bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Checking..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSellerPincode("");
              setCustomerPincode("");
              setAvailableCouriers([]);
              setError("");
            }}
            className="px-6 py-2 cursor-pointer leading-5 text-white transition-colors duration-200 transform bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4 text-center">{error}</p>}
      <div className="mt-6">
        {!loading && availableCouriers.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Available Couriers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableCouriers.map((courier, index) => {
                const logoUrl = getCourierLogo(courier.courierName);
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-center">
                    {logoUrl && (
                      <img src={logoUrl} alt={`${courier.courierName} logo`} className="h-16 w-auto mb-3 object-contain"/>
                    )}
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{courier.courierName}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Service Available</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !loading && !error && availableCouriers.length === 0 && sellerPincode && customerPincode && ( // Show only if form was submitted
             <p className="text-gray-500 dark:text-gray-400 text-center">Enter pincodes to check serviceability.</p>
          )
        )}
         {loading && <p className="text-gray-500 dark:text-gray-400"><Loading/></p>}
      </div>
    </div>
  );
}