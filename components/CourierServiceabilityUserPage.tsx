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

  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setServices([]); 
    try {
      const response = await axios.post("/api/user/courier-serviceability", {
        sellerPincode,
        customerPincode,
      });

      const data = response.data;
      if (response.status !== 200 || !data.services) {
         setError(data.error || "Something went wrong");
      } else if (data.services.length === 0) {
        setError("No courier services found for the given pincodes.");
      } else {
        setServices(data.services);
      }
    } catch (err: any) {
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError("Failed to fetch serviceability data.");
        }
      }finally {
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
            Seller's Pincode
          </label>
          <input
            id="sellerPincode"
            type="text"
            value={sellerPincode}
            onChange={(e) => setSellerPincode(e.target.value)}
            className="block w-full px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
            placeholder="Enter Seller's Pincode"
            required
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
              setServices([]);
              setError("");
            }}
            className="px-6 py-2 cursor-pointer leading-5 text-white transition-colors duration-200 transform bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4">{error}</p>}
      <div className="mt-6">
        {!loading && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-4 shadow bg-white dark:bg-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{service.courierName}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{service.serviceType}</p>
                <ul className="mt-2 space-y-1"> 
                  {Object.entries(service.services).map(([key, value]) => (
                    <li key={key} className="flex items-center text-gray-700 dark:text-gray-300">
                      <span className="mr-2 flex-1">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      {value ? (
                        <span className="text-green-500 font-bold">✔</span>
                      ) : (
                        <span className="text-red-500 font-bold">✘</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && services.length === 0 && (
             <p className="text-gray-500 dark:text-gray-400">Enter pincodes to check serviceability.</p>
          )
        )}
         {loading && <p className="text-gray-500 dark:text-gray-400"><Loading/></p>}
      </div>
    </div>
  );
}