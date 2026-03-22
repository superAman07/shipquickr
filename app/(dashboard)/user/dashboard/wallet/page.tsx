"use client";
import { useEffect, useState, useMemo } from "react";
import { Wallet, PlusCircle, Loader2, FileCheck, Home, ChevronRight, ChevronLeft, CreditCard } from "lucide-react";
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
  description: string;
  status: string;
  referenceId?: string | null;
  receiptUrl?: string | null;
}

export default function WalletPage() {
  const title = "My Wallet", subtitle = "Manage your wallet balance and transactions";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const { balance: contextBalance, isLoadingBalance: isContextLoading, refreshBalance } = useWallet();

  const searchParams = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const [verifying, setVerifying] = useState(false);

  // Pagination & Filtering state
  const [filter, setFilter] = useState<"all" | "success" | "rejected">("success");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const orderId = merchantOrderId || sessionStorage.getItem("pendingMerchantOrderId");
    if (!orderId) return;
    sessionStorage.removeItem("pendingMerchantOrderId");
    
    setVerifying(true);
    axios.post("/api/user/wallet/verify", { merchantOrderId: orderId })
      .then((res) => {
        if (res.data.success) {
          toast.success("Payment successful! Wallet has been credited. ✅");
          refreshBalance();
          fetchTransactions();
        } else if (res.data.state === "PENDING") {
          toast.info("Payment is still pending. Balance will update shortly.");
        } else {
          toast.error("Payment failed or was cancelled.");
        }
      })
      .catch(() => toast.error("Could not verify payment status."))
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantOrderId]);

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextBalance]);

  const fetchTransactions = () => {
    setLoading(true);
    axios.get("/api/user/wallet")
      .then(res => {
        // Map any PENDING status to REJECTED based on new logic
        const formattedTxns = (res.data.transactions || []).map((t: Transaction) => {
          if (t.status.toUpperCase() === "PENDING") {
            return { ...t, status: "REJECTED" };
          }
          return t;
        });
        setTransactions(formattedTxns);
      })
      .catch(() => toast.error("Failed to load wallet info"))
      .finally(() => setLoading(false));
  };

  // Filter and paginate logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
      if (filter === "success") return isSuccess;
      if (filter === "rejected") return !isSuccess;
      return true; // "all"
    });
  }, [transactions, filter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1); // Reset page to 1 when filter changes
  }, [filter]);

  const handleAddMoney = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      toast.error("Enter a valid amount (min ₹1)");
      return;
    }
    setAdding(true);
    try {
      const response = await axios.post("/api/user/wallet", { amount: Number(amount) });

      if (response.data.success && response.data.redirectUrl) {
        const { redirectUrl, merchantOrderId } = response.data;
        const walletReturnUrl = new URL(window.location.href);
        walletReturnUrl.searchParams.set("merchantOrderId", merchantOrderId);
        sessionStorage.setItem("pendingMerchantOrderId", merchantOrderId || "");
        window.location.href = redirectUrl;
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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-10">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 mt-10 sm:mt-0 shadow-sm border-b border-gray-100 dark:border-gray-800 mb-6">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/user/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
                <Home className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-gray-900 dark:text-gray-200">My Wallet</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {verifying && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-blue-800 dark:text-blue-300 text-sm font-medium shadow-sm animate-pulse">
            <Loader2 className="animate-spin h-5 w-5" />
            Verifying your payment with PhonePe, please hold on...
          </div>
        )}

        {/* Wallet Balance Card */}
        <Card className="border-0 shadow-lg bg-linear-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden ring-1 ring-gray-900/5 dark:ring-white/10">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Balance</h2>
                  <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    {isContextLoading ? <Loader2 className="animate-spin h-8 w-8" /> : <>₹{contextBalance !== null ? contextBalance.toFixed(2) : "--"}</>}
                  </div>
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md hover:shadow-lg transition-all rounded-xl py-6 font-semibold"
                onClick={() => setShowModal(true)}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Money to Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Money Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 h-screen">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-4">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fund Wallet</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Instantly load money via PhonePe gateway.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">₹</span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-8 text-lg py-6 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  {[500, 1000, 2000].map(val => (
                    <button 
                      key={val} 
                      onClick={() => setAmount(val.toString())}
                      className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-semibold mt-4 cursor-pointer shadow-md"
                  onClick={handleAddMoney}
                  disabled={adding}
                >
                  {adding ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</> : "Proceed to Pay securely"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        <Card className="border-0 shadow-md bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden mt-8">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Transaction History
              </CardTitle>
              
              {/* Filter Tabs */}
              <div className="flex bg-gray-200/60 dark:bg-gray-800/60 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setFilter("all")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-medium rounded-lg transition-all ${filter === "all" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("success")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-medium rounded-lg transition-all ${filter === "success" ? "bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"}`}
                >
                  Success
                </button>
                <button
                  onClick={() => setFilter("rejected")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-medium rounded-lg transition-all ${filter === "rejected" ? "bg-white dark:bg-gray-700 shadow text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"}`}
                >
                  Rejected
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading transactions...</p>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No transactions found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                  {filter === "success" ? "You don't have any successful transactions yet." : filter === "rejected" ? "No rejected transactions." : "Your wallet history is empty."}
                </p>
              </div>
            ) : (
              <div>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-gray-800/50">
                      <TableRow className="border-b border-gray-100 dark:border-gray-800">
                        <TableHead className="py-4 pl-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
                        <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Description</TableHead>
                        <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</TableHead>
                        <TableHead className="py-4 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((txn) => {
                        const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
                        const isCredit = txn.type === "recharge" || txn.type === "credit";
                        
                        return (
                          <TableRow key={txn.id} className="border-b border-gray-50 dark:border-gray-800/80 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                            <TableCell className="pl-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {new Date(txn.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{txn.description}</p>
                              {txn.referenceId && <p className="text-xs text-gray-500 font-mono mt-1">Ref: {txn.referenceId}</p>}
                              {txn.receiptUrl && (
                                <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-flex items-center">
                                  View Receipt
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isSuccess
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                              }`}>
                                {isSuccess ? "Success" : txn.status}
                              </span>
                            </TableCell>
                            <TableCell className="pr-6 py-4 text-right">
                              <span className={`text-base font-bold tabular-nums ${
                                isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                              }`}>
                                {isCredit ? "+" : "-"} ₹{txn.amount.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="block lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedTransactions.map((txn) => {
                    const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
                    const isCredit = txn.type === "recharge" || txn.type === "credit";

                    return (
                      <div key={txn.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                           <span className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 pr-2">{txn.description}</span>
                           <span className="text-xs text-gray-500 mt-1">
                             {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, {new Date(txn.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                           </span>
                          </div>
                          <span className={`text-base font-bold tabular-nums shrink-0 mt-0.5 ${
                                isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                              }`}>
                            {isCredit ? "+" : "-"}₹{txn.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div className="flex flex-col gap-1.5">
                            {txn.referenceId && <span className="text-[11px] text-gray-500 font-mono">Ref: {txn.referenceId}</span>}
                            {txn.receiptUrl && (
                                <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                                  View Receipt
                                </a>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isSuccess
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                            {isSuccess ? "Success" : txn.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}