"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export function AdminWalletRechargeModal({
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess
}: {
  userId: number;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) return toast.error("Enter a valid amount");

    setLoading(true);
    const formData = new FormData();
    formData.append("userId", userId.toString());
    formData.append("amount", amount);
    if (remarks) formData.append("remarks", remarks);
    if (file) formData.append("receipt", file);

    try {
      const res = await axios.post("/api/admin/wallet/recharge", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess(); // Trigger refresh on parent
        onClose(); // Hide modal
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Recharge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Manual Recharge for {userName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Amount (₹) *</label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Remarks / Reference Info *</label>
            <Input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cash collected by John, ref #1234"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Payment Receipt (Optional)</label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Add Funds to Wallet
          </Button>
        </form>
      </div>
    </div>
  );
}
