"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";

export default function RateCalculator() {
  const [form, setForm] = useState({
    paymentMode: "COD",
    pickupPincode: "",
    destinationPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    declaredValue: "",
    collectableValue: "",
  });
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try { 
      const res = await axios.post("/api/admin/rate-calculator", form);
      setRates(res.data.rates || []);
    } catch {
      setRates([]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8"> 
      <form onSubmit={handleSubmit} className="rounded-lg shadow p-4 sm:p-6 w-full md:w-1/2 space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Payment Mode</label>
            <Select value={form.paymentMode} onValueChange={v => handleSelect("paymentMode", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COD">COD</SelectItem>
                <SelectItem value="Prepaid">Prepaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label>Pickup Area Pincode</label>
            <Input name="pickupPincode" value={form.pickupPincode} onChange={handleChange} required />
          </div>
          <div>
            <label>Destination Pincode</label>
            <Input name="destinationPincode" value={form.destinationPincode} onChange={handleChange} required />
          </div>
          <div>
            <label>Weight (Kg)</label>
            <Input name="weight" value={form.weight} onChange={handleChange} required />
          </div>
          <div>
            <label>Dimensions (cm)</label>
            <div className="flex gap-2">
              <Input name="length" value={form.length} onChange={handleChange} placeholder="L" required />
              <Input name="width" value={form.width} onChange={handleChange} placeholder="W" required />
              <Input name="height" value={form.height} onChange={handleChange} placeholder="H" required />
            </div>
          </div>
          <div>
            <label>Declared Value (INR)</label>
            <Input name="declaredValue" value={form.declaredValue} onChange={handleChange} required />
          </div>
          <div> 
            <label className="text-gray-700 dark:text-gray-200">Collectable Value (INR)</label>
            {form.paymentMode === "COD" ? (
                <Input
                name="collectableValue"
                value={form.collectableValue}
                onChange={handleChange}
                required
                />
            ) : (
                <Input
                name="collectableValue"
                value={form.collectableValue}
                disabled
                placeholder="Not required for Prepaid"
                />
            )}
          </div>
        </div>
        <Button type="submit" className="w-full md:w-auto mt-4" disabled={loading}>
          {loading ? "Checking..." : "Check Price"}
        </Button>
      </form>

      {/* Right: Shipping Rates */}
      <div className="w-full pl-4 md:w-1/2">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Shipping Rates</h2>
        {rates.length === 0 && <div className="text-gray-500 dark:text-gray-400">No rates found.</div>}
        <div className="space-y-4">
          {rates.map((rate, idx) => (
            <Card
            key={idx}
            className="flex flex-col gap-2 sm:gap-4 md:flex-row items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{rate.courierName}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{rate.serviceType}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
              <div className="text-gray-700 dark:text-gray-300">Weight: {rate.weight}Kg</div>
              <div className="text-gray-700 dark:text-gray-300">Courier Charges: ₹{rate.courierCharges}</div>
              <div className="text-gray-700 dark:text-gray-300">COD Charges: ₹{rate.codCharges}</div>
              <div className="font-bold text-gray-900 dark:text-white">Total Price: ₹{rate.totalPrice}</div>
            </div>
          </Card>
          ))}
        </div>
      </div>
    </div>
  );
}