"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const initialWarehouse = {
  id: undefined as number | string | undefined,
  warehouseName: "",
  pincode: "",
  address1: "",
  address2: "",
  landmark: "",
  state: "",
  city: "",
  contactName: "",
  mobile: "",
};

export default function AddWarehouseModal({ open, onClose, onSuccess, editData }: { open: boolean, onClose: () => void, onSuccess: () => void, editData?: typeof initialWarehouse }) {
  const [form, setForm] = useState(initialWarehouse);
  const [submitting, setSubmitting] = useState(false);
 
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    setForm(f => ({ ...f, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0].Status === "Success") {
          setForm(f => ({
            ...f,
            state: data[0].PostOffice[0].State,
            city: data[0].PostOffice[0].District
          }));
        }
      } catch {}
    }
  };
  useEffect(() => {
    if (editData) setForm(editData);
    else setForm(initialWarehouse);
  }, [editData, open]);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); 
    setSubmitting(true); 
    try { 
      if (form.id) {
        // Edit mode
        await axios.patch(`/api/user/warehouses/${form.id}`, form);
        toast.success("Warehouse updated successfully");
      } else {
        // Add mode
        await axios.post("/api/user/warehouses", form);
        toast.success("Warehouse added successfully");
      }
      setForm(initialWarehouse);
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to add warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-2xl relative">
        <button
          type="button"
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Add Pickup Address</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pincode *</label>
              <input className="border p-2 rounded w-full" required value={form.pincode} onChange={handlePincodeChange} placeholder="Enter Pincode" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
              <input className="border p-2 rounded w-full" required value={form.warehouseName} onChange={e => setForm(f => ({ ...f, warehouseName: e.target.value }))} placeholder="Enter Warehouse Name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address 1 *</label>
              <input className="border p-2 rounded w-full" required value={form.address1} onChange={e => setForm(f => ({ ...f, address1: e.target.value }))} placeholder="House No./Ward/Building" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address 2</label>
              <input className="border p-2 rounded w-full" value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="Road/Area/Colony" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Famous Landmark</label>
              <input className="border p-2 rounded w-full" value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} placeholder="Enter Famous Landmark" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <input className="border p-2 rounded w-full" required value={form.state} readOnly tabIndex={-1} placeholder="State will autofill" title="State will autofill based on Pincode" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input className="border p-2 rounded w-full" required value={form.city} readOnly tabIndex={-1} placeholder="City will autofill" title="City will autofill based on Pincode" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name *</label>
              <input className="border p-2 rounded w-full" required value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Enter Contact Name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mobile *</label>
              <input className="border p-2 rounded w-full" required value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="Enter Mobile Number" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 cursor-pointer rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 cursor-pointer rounded bg-indigo-700 text-white font-semibold" disabled={submitting}>
              {submitting ? "Adding..." : "Add Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}