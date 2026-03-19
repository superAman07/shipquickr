"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Home, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-toastify";
import axios from "axios";
import Link from "next/link";

interface PendingTx {
  id: number;
  createdAt: string;
  amount: number;
  merchantTransactionId: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  phonePeState?: "COMPLETED" | "FAILED" | "PENDING" | "checking" | null;
}

export default function AdminPendingTransactionsPage() {
  const [transactions, setTransactions] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchPending = () => {
    setLoading(true);
    axios.get("/api/admin/wallet/pending")
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => toast.error("Failed to load pending transactions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleVerify = async (tx: PendingTx) => {
    setVerifyingId(tx.id);
    try {
      const res = await axios.post("/api/admin/wallet/pending", {
        merchantTransactionId: tx.merchantTransactionId,
      });

      if (res.data.success) {
        toast.success(`✅ ${res.data.message}`);
        // Remove this tx from list as it's now resolved
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
      } else {
        toast.warn(`⚠️ ${res.data.message}`);
        // Update the displayed PhonePe state for this row
        setTransactions(prev => prev.map(t =>
          t.id === tx.id ? { ...t, phonePeState: res.data.state as any } : t
        ));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleManualRecharge = (tx: PendingTx) => {
    // Navigate to users page — admin can use manual recharge modal there
    window.open(`/admin/dashboard/users`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-4 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-2 dark:text-amber-50">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">Pending Wallet Transactions</h1>
            </div>
            <p className="text-xs sm:text-sm text-primary-foreground/80 dark:text-amber-50/90">
              Payments stuck as "Pending" — verify PhonePe status and auto-credit wallet
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
            <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300 transition-colors">
              <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
            <span className="font-medium">Pending Transactions</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <Card className="shadow bg-white dark:bg-gray-900 border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-semibold">
              Pending PhonePe Recharges
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
                <p className="font-medium">No pending transactions 🎉</p>
                <p className="text-sm mt-1">All payments have been processed.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-3 mb-4">
                  ⚠️ <strong>{transactions.length}</strong> payment{transactions.length > 1 ? "s" : ""} stuck as "Pending". Click <strong>Verify & Credit</strong> to check PhonePe and auto-credit if payment was successful.
                </p>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-4">
                  {transactions.map(tx => (
                    <div key={tx.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{tx.user.firstName} {tx.user.lastName}</p>
                          <p className="text-xs text-gray-500">{tx.user.email}</p>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400 text-base">₹{tx.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">🕐 {new Date(tx.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mb-3 font-mono break-all">ID: {tx.merchantTransactionId}</p>
                      {tx.phonePeState && (
                        <PhonePeStateBadge state={tx.phonePeState} />
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleVerify(tx)}
                        disabled={verifyingId === tx.id}
                      >
                        {verifyingId === tx.id
                          ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Checking PhonePe…</>
                          : "Verify & Credit"}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>PhonePe Order ID</TableHead>
                        <TableHead>PhonePe Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.user.firstName} {tx.user.lastName}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{tx.user.email}</TableCell>
                          <TableCell className="font-bold text-green-600 dark:text-green-400">
                            ₹{tx.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-gray-500 max-w-[180px] truncate" title={tx.merchantTransactionId}>
                            {tx.merchantTransactionId}
                          </TableCell>
                          <TableCell>
                            {tx.phonePeState
                              ? <PhonePeStateBadge state={tx.phonePeState} />
                              : <span className="text-xs text-gray-400">Not checked</span>}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleVerify(tx)}
                              disabled={verifyingId === tx.id}
                              className="whitespace-nowrap"
                            >
                              {verifyingId === tx.id
                                ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Checking…</>
                                : "Verify & Credit"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PhonePeStateBadge({ state }: { state: string }) {
  if (state === "COMPLETED") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
  if (state === "FAILED" || state === "CANCELLED") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
      <XCircle className="h-3 w-3" /> {state}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}
