'use client'
import axios from "axios";
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

    try {
      const response = await axios.post("/api/user/courier-serviceability", {
        sellerPincode,
        customerPincode,
      });

      const data = response.data;
      if (response.status !== 200 || !data.services) {
        setError(data.error || "Something went wrong");
      } else {
        setServices(data.services || []);
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
      <h1 className="text-2xl font-bold mb-4">Courier Serviceability</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sellerPincode">
            Seller's Pincode
          </label>
          <input
            id="sellerPincode"
            type="text"
            value={sellerPincode}
            onChange={(e) => setSellerPincode(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter Seller's Pincode"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerPincode">
            Customer's Pincode
          </label>
          <input
            id="customerPincode"
            type="text"
            value={customerPincode}
            onChange={(e) => setCustomerPincode(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter Customer's Pincode"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="mt-6">
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div key={index} className="border rounded p-4 shadow">
                <h2 className="text-lg font-bold">{service.courierName}</h2>
                <p className="text-sm text-gray-600">{service.serviceType}</p>
                <ul className="mt-2">
                  {Object.entries(service.services).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className="mr-2">{key.replace(/([A-Z])/g, " $1")}</span>
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
          <p className="text-gray-500">No services available.</p>
        )}
      </div>
    </div>
  );
}