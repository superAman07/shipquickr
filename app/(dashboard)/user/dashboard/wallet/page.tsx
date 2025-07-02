"use client";
import { useEffect, useState } from "react";
import { Wallet, PlusCircle, Loader2, FileCheck, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";


interface Transaction {
  id: number;
  createdAt: string;
  type: "recharge" | "debit" | "credit";
  amount: number;
}

export default function WalletPage() {
  const title = "My Wallet", subtitle = "Manage your wallet balance and transactions"
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const { balance: contextBalance, isLoadingBalance: isContextLoading, refreshBalance } = useWallet();

  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");

  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast.success("Wallet recharge successful!");
      refreshBalance();
    } else if (paymentStatus === "FAILED") {
      toast.error("Payment failed or cancelled.");
    }
  }, [paymentStatus]);
  useEffect(() => {
    setLoading(true);
    axios.get("/api/user/wallet")
      .then(res => {
        setTransactions(res.data.transactions || []);
      })
      .catch(() => toast.error("Failed to load wallet info"))
      .finally(() => setLoading(false));
  }, [contextBalance]);

  const handleAddMoney = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      toast.error("Enter a valid amount (min ₹1)");
      return;
    }
    setAdding(true);
    try { 
      const response = await axios.post("/api/user/wallet", { amount: Number(amount) });

      if (response.data.success && response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
        return;
      } else {
        toast.error(response.data.error || "Failed to initiate payment.");
      }
    } catch (err: any) {
      console.error("handleAddMoney error:", err);
      toast.error(err.response?.data?.error || "Failed to initiate payment. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
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
            <span className="font-medium truncate">My Wallet</span>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4">
        <Card className="mb-6 shadow-lg bg-white dark:bg-gray-900 border-0">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full">
              <Wallet className="h-8 w-8 text-green-600 dark:text-green-400" />
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                My Wallet
              </CardTitle>
              <span className="ml-auto text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {isContextLoading ? <Loader2 className="animate-spin" /> : <>₹ {contextBalance !== null ? contextBalance.toFixed(2) : "--"}</>}
              </span>
            </div>
            <Button
              variant="default"
              className="w-full sm:w-auto flex items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <PlusCircle className="h-5 w-5" />
              Add Money
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Use your wallet balance to pay for shipments instantly.
            </p>
          </CardContent>
        </Card>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs sm:max-w-sm relative">
              <button
                className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Add Money</h2>
              <Input
                type="number"
                min={1}
                placeholder="Enter amount (₹)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mb-4"
                autoFocus
              />
              <Button
                className="w-full"
                onClick={handleAddMoney}
                disabled={adding}
              >
                {adding ? <Loader2 className="animate-spin" /> : "Proceed to Pay"}
              </Button>
              <p className="text-xs text-gray-400 mt-2">Powered by PhonePe</p>
            </div>
          </div>
        )}

        <Card className="shadow bg-white dark:bg-gray-900 border-0 mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                No transactions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${txn.type === "recharge" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          ₹ {txn.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}