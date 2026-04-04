"use client";
import { useEffect, useState, useMemo } from "react";
import { Wallet, Loader2, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const { balance: contextBalance, isLoadingBalance: isContextLoading, refreshBalance } = useWallet();
  const searchParams = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const [verifying, setVerifying] = useState(false);

  const [filter, setFilter] = useState<"all" | "success" | "failed">("success");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const orderId = merchantOrderId || sessionStorage.getItem("pendingMerchantOrderId");
    if (!orderId) return;
    sessionStorage.removeItem("pendingMerchantOrderId");

    setVerifying(true);
    axios.post("/api/user/wallet/verify", { merchantOrderId: orderId })
      .then((res) => {
        if (res.data.success) {
          toast.success("Payment successful! Wallet has been credited.");
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
  }, [merchantOrderId]);

  useEffect(() => {
    fetchTransactions();
  }, [contextBalance]);

  const fetchTransactions = () => {
    setLoading(true);
    axios.get("/api/user/wallet")
      .then(res => {
        const formattedTxns = (res.data.transactions || [])
          .filter((t: Transaction) => t.status.toUpperCase() !== "PENDING")
          .map((t: Transaction) => {
            const upStatus = t.status.toUpperCase();
            if (upStatus === "PAYMENT_ERROR" || upStatus === "PAYMENT_DECLINED" || upStatus === "FAILED" || upStatus === "REJECTED") {
              return { ...t, status: "FAILED" };
            }
            if (upStatus === "COMPLETED" || upStatus === "SUCCESS") {
              return { ...t, status: "SUCCESS" };
            }
            return t;
          });
        setTransactions(formattedTxns);
      })
      .catch(() => toast.error("Failed to load wallet info"))
      .finally(() => setLoading(false));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const isSuccess = txn.status.toUpperCase() === "SUCCESS";
      if (filter === "success") return isSuccess;
      if (filter === "failed") return !isSuccess;
      return true;
    });
  }, [transactions, filter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const successCount = transactions.filter(t => t.status.toUpperCase() === "SUCCESS").length;
  const failedCount = transactions.filter(t => t.status.toUpperCase() !== "SUCCESS").length;

  const getTxnIcon = (txn: Transaction) => {
    if (txn.type === "recharge" || txn.type === "credit") {
      return (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
          <ArrowDownLeft size={16} strokeWidth={2.5} />
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-500 shrink-0">
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </span>
    );
  };

  const filterTabs: { key: "all" | "success" | "failed"; label: string; count: number }[] = [
    { key: "success", label: "Successful", count: successCount },
    { key: "failed", label: "Failed", count: failedCount },
    { key: "all", label: "All", count: transactions.length },
  ];

  return (
    <div className="w-full bg-transparent min-h-screen pb-12 font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .wallet-root { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        .navy-gradient {
          background: linear-gradient(135deg, #0a0c37 0%, #141863 60%, #1a1f7a 100%);
        }
        .card-shadow {
          box-shadow: 0 1px 3px rgba(10,12,55,0.07), 0 4px 16px rgba(10,12,55,0.06);
        }
        .tab-active {
          background: #0a0c37;
          color: #fff;
        }
        .tab-inactive {
          background: transparent;
          color: #6b7280;
        }
        .tab-inactive:hover {
          background: #eef0f8;
          color: #0a0c37;
        }
        .txn-row:not(:last-child) {
          border-bottom: 1px solid #f0f1f5;
        }
        .pulse-dot {
          animation: pulse-dot 1.8s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .amount-credit { color: #059669; }
        .amount-debit { color: #dc2626; }
        .amount-neutral { color: #0a0c37; }
        @media (max-width: 640px) {
          .balance-amount { font-size: 2rem; }
        }
      `}</style>

      <div className="wallet-root max-w-2xl mx-auto space-y-6 pt-4 sm:pt-6">

        {/* Page Header (Adjusted to not collide with Dashboard Header) */}
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-[#0a0c37] dark:text-white text-2xl font-bold tracking-tight">Wallet</h1>
            <p className="text-sm text-gray-400 mt-0.5">Credits &amp; transaction history</p>
          </div>
          <span className="flex items-center justify-center w-10 h-10 rounded-xl navy-gradient shadow-md">
            <Wallet size={18} className="text-white" />
          </span>
        </div>

        {/* Verification Banner */}
        {verifying && (
          <div className="mx-2 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <Loader2 size={16} className="animate-spin shrink-0 text-amber-500" />
            <span>Verifying your payment with the gateway. Please hold on…</span>
          </div>
        )}

        {/* Balance Card */}
        <div className="mx-2 navy-gradient rounded-2xl p-6 sm:p-8 card-shadow relative overflow-hidden">
          {/* Decorative circles */}
          <span className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white opacity-[0.04] pointer-events-none" />
          <span className="absolute bottom-0 left-1/2 w-80 h-28 rounded-full bg-white opacity-[0.03] pointer-events-none -translate-x-1/2" />

          <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">Available Credits</p>

          <div className="flex items-end gap-2 mb-5">
            {isContextLoading ? (
              <Loader2 size={30} className="text-white animate-spin mb-1" />
            ) : (
              <span className="balance-amount mono text-white font-bold text-[2.5rem] sm:text-[3rem] leading-none tracking-tight">
                ₹{Math.max(0, contextBalance || 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3.5 py-2.5 w-fit border border-white/5 shadow-inner">
            <span className="pulse-dot w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-white/80 text-xs font-medium">Use the Recharge button in your top navigation to add funds.</p>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 border border-white/5 rounded-xl px-4 py-3 shadow-inner">
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1.5">Successful</p>
              <p className="text-white font-bold text-lg mono">{successCount}</p>
            </div>
            <div className="bg-white/10 border border-white/5 rounded-xl px-4 py-3 shadow-inner">
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1.5">Failed</p>
              <p className="text-white font-bold text-lg mono">{failedCount}</p>
            </div>
          </div>
        </div>

        {/* Transaction Section */}
        <div className="mx-2 bg-white dark:bg-gray-900 rounded-2xl card-shadow overflow-hidden border border-gray-100 dark:border-gray-800">

          {/* Tabs */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto hidden-scrollbar">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shrink-0 ${filter === tab.key ? "tab-active dark:bg-blue-600 dark:text-white" : "tab-inactive dark:text-gray-400"}`}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md mono font-black ${filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Transactions */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={24} className="animate-spin text-[#0a0c37]/40 dark:text-gray-600" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Compiling history…</span>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 mb-2 border border-gray-100 dark:border-gray-700">
                <Wallet size={22} className="text-gray-300 dark:text-gray-500" />
              </span>
              <p className="text-sm font-bold text-gray-400">No records found</p>
              <p className="text-xs text-gray-300">Try switching the filter above</p>
            </div>
          ) : (
            <ul>
              {paginatedTransactions.map((txn) => {
                const isSuccess = txn.status.toUpperCase() === "SUCCESS";
                const isCredit = txn.type === "recharge" || txn.type === "credit";
                return (
                  <li key={txn.id} className="txn-row dark:border-gray-800 flex items-center gap-3 px-4 py-4 hover:bg-[#f8f9ff] dark:hover:bg-gray-800/30 transition-colors duration-150">
                    {getTxnIcon(txn)}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-[#0a0c37] dark:text-gray-200 truncate leading-snug">{txn.description}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                        {new Date(txn.createdAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <span className={`mono text-sm font-bold ${isCredit ? "amount-credit dark:text-emerald-400" : "amount-debit dark:text-red-400"}`}>
                        {isCredit ? "+" : "-"}₹{txn.amount.toFixed(2)}
                      </span>
                      <span className={`flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md ${isSuccess ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"}`}>
                        {isSuccess
                          ? <><CheckCircle2 size={10} strokeWidth={2.5} />Success</>
                          : <><XCircle size={10} strokeWidth={2.5} />Failed</>
                        }
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Page <span className="font-bold text-[#0a0c37] dark:text-white">{currentPage}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#0a0c37] dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold text-[#0a0c37] dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// "use client";
// import { useEffect, useState, useMemo } from "react";
// import { Wallet, PlusCircle, Loader2, FileCheck, Home, ChevronRight, ChevronLeft, CreditCard } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";
// import { useWallet } from "@/contexts/WalletContext";

// interface Transaction {
//   id: number;
//   createdAt: string;
//   type: "recharge" | "debit" | "credit";
//   amount: number;
//   description: string;
//   status: string;
//   referenceId?: string | null;
//   receiptUrl?: string | null;
// }

// export default function WalletPage() {
//   const title = "My Wallet", subtitle = "Manage your wallet balance and transactions";
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [adding, setAdding] = useState(false);

//   const { balance: contextBalance, isLoadingBalance: isContextLoading, refreshBalance } = useWallet();

//   const searchParams = useSearchParams();
//   const merchantOrderId = searchParams.get("merchantOrderId");
//   const [verifying, setVerifying] = useState(false);

//   // Pagination & Filtering state
//   const [filter, setFilter] = useState<"all" | "success" | "rejected">("success");
//   const [currentPage, setCurrentPage] = useState(1);
//   const ITEMS_PER_PAGE = 5;

//   useEffect(() => {
//     const orderId = merchantOrderId || sessionStorage.getItem("pendingMerchantOrderId");
//     if (!orderId) return;
//     sessionStorage.removeItem("pendingMerchantOrderId");
    
//     setVerifying(true);
//     axios.post("/api/user/wallet/verify", { merchantOrderId: orderId })
//       .then((res) => {
//         if (res.data.success) {
//           toast.success("Payment successful! Wallet has been credited. ✅");
//           refreshBalance();
//           fetchTransactions();
//         } else if (res.data.state === "PENDING") {
//           toast.info("Payment is still pending. Balance will update shortly.");
//         } else {
//           toast.error("Payment failed or was cancelled.");
//         }
//       })
//       .catch(() => toast.error("Could not verify payment status."))
//       .finally(() => setVerifying(false));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [merchantOrderId]);

//   useEffect(() => {
//     fetchTransactions();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [contextBalance]);

//   const fetchTransactions = () => {
//     setLoading(true);
//     axios.get("/api/user/wallet")
//       .then(res => {
//         const formattedTxns = (res.data.transactions || []).map((t: Transaction) => {
//           if (t.status.toUpperCase() === "PENDING") {
//             return { ...t, status: "REJECTED" };
//           }
//           return t;
//         });
//         setTransactions(formattedTxns);
//       })
//       .catch(() => toast.error("Failed to load wallet info"))
//       .finally(() => setLoading(false));
//   };

//   const filteredTransactions = useMemo(() => {
//     return transactions.filter(txn => {
//       const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
//       if (filter === "success") return isSuccess;
//       if (filter === "rejected") return !isSuccess;
//       return true;
//     });
//   }, [transactions, filter]);

//   const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
//   const paginatedTransactions = filteredTransactions.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE
//   );

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [filter]);

//   const handleAddMoney = async () => {
//     if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
//       toast.error("Enter a valid amount (min ₹1)");
//       return;
//     }
//     setAdding(true);
//     try {
//       const response = await axios.post("/api/user/wallet", { amount: Number(amount) });

//       if (response.data.success && response.data.redirectUrl) {
//         const { redirectUrl, merchantOrderId } = response.data;
//         const walletReturnUrl = new URL(window.location.href);
//         walletReturnUrl.searchParams.set("merchantOrderId", merchantOrderId);
//         sessionStorage.setItem("pendingMerchantOrderId", merchantOrderId || "");
//         window.location.href = redirectUrl;
//         return;
//       } else {
//         toast.error(response.data.error || "Failed to initiate payment.");
//       }
//     } catch (err: any) {
//       console.error("handleAddMoney error:", err);
//       toast.error(err.response?.data?.error || "Failed to initiate payment. Please try again.");
//     } finally {
//       setAdding(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-transparent pb-10">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 space-y-8">
        
//         {/* Sleek Integrated Header without full width background */}
//         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//           <div>
//             <div className="flex items-center gap-3">
//               <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl shadow-sm">
//                 <FileCheck className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
//               </div>
//               <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h1>
//             </div>
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{subtitle}</p>
//           </div>
          
//           {/* Breadcrumb Pill */}
//           <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
//             <Link href="/user/dashboard" className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
//               <Home className="h-4 w-4 mr-1.5" />
//               <span>Dashboard</span>
//             </Link>
//             <ChevronRight className="h-4 w-4 text-gray-400" strokeWidth={3} />
//             <span className="text-gray-900 dark:text-gray-200">My Wallet</span>
//           </div>
//         </div>

//         {verifying && (
//           <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800 p-4 text-indigo-800 dark:text-indigo-300 text-sm font-medium shadow-sm animate-pulse">
//             <Loader2 className="animate-spin h-5 w-5" />
//             Verifying your payment with PhonePe, please hold on...
//           </div>
//         )}

//         {/* Wallet Balance Card */}
//         <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-900/5 dark:ring-white/10">
//           <CardContent className="p-6 sm:p-8">
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
//               <div className="flex items-center gap-5 w-full sm:w-auto">
//                 <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
//                   <Wallet className="h-9 w-9 text-indigo-700 dark:text-indigo-400" />
//                 </div>
//                 <div>
//                   <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Balance</h2>
//                   <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
//                     {isContextLoading ? <Loader2 className="animate-spin h-8 w-8" /> : <>₹{contextBalance !== null ? contextBalance.toFixed(2) : "--"}</>}
//                   </div>
//                 </div>
//               </div>
              
//               <Button
//                 size="lg"
//                 className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md hover:shadow-xl transition-all rounded-xl py-6 px-8 font-semibold"
//                 onClick={() => setShowModal(true)}
//               >
//                 <PlusCircle className="h-5 w-5 mr-2" />
//                 Add Money to Wallet
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Add Money Modal */}
//         {showModal && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 h-screen">
//             <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 ring-1 ring-gray-900/10">
//               <button
//                 className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full"
//                 onClick={() => setShowModal(false)}
//               >
//                 <span className="sr-only">Close</span>
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
//               </button>
              
//               <div className="flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl mb-5 shadow-inner">
//                 <CreditCard className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
//               </div>
//               <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Fund Wallet</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Instantly load money via secure gateway.</p>
              
//               <div className="space-y-5">
//                 <div className="relative group">
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors font-medium text-xl">₹</span>
//                   <Input
//                     type="number"
//                     min={1}
//                     placeholder="0.00"
//                     value={amount}
//                     onChange={e => setAmount(e.target.value)}
//                     className="pl-9 text-xl py-7 bg-gray-50/50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold transition-all"
//                     autoFocus
//                   />
//                 </div>
//                 <div className="flex gap-2.5">
//                   {[500, 1000, 2000].map(val => (
//                     <button 
//                       key={val} 
//                       onClick={() => setAmount(val.toString())}
//                       className="flex-1 py-2.5 text-sm font-bold bg-indigo-50/50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-gray-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-gray-700 transition cursor-pointer"
//                     >
//                       +₹{val}
//                     </button>
//                   ))}
//                 </div>
//                 <Button
//                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl font-bold mt-2 shadow-lg cursor-pointer hover:shadow-indigo-500/25 transition-all outline-none"
//                   onClick={handleAddMoney}
//                   disabled={adding}
//                 >
//                   {adding ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Processing...</> : "Proceed to Pay Securely"}
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Transactions Section */}
//         <Card className="border-0 shadow-md bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
//           <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50 px-6 py-5">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//               <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                 Transaction History
//               </CardTitle>
              
//               {/* Filter Tabs */}
//               <div className="flex bg-gray-100/80 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-auto shadow-inner border border-gray-200/50 dark:border-gray-700/50">
//                 <button
//                   onClick={() => setFilter("all")}
//                   className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-semibold rounded-lg transition-all ${filter === "all" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
//                 >
//                   All
//                 </button>
//                 <button
//                   onClick={() => setFilter("success")}
//                   className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-semibold rounded-lg transition-all ${filter === "success" ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
//                 >
//                   Success
//                 </button>
//                 <button
//                   onClick={() => setFilter("rejected")}
//                   className={`flex-1 sm:flex-none px-4 py-1.5 text-sm cursor-pointer font-semibold rounded-lg transition-all ${filter === "rejected" ? "bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"}`}
//                 >
//                   Rejected
//                 </button>
//               </div>
//             </div>
//           </CardHeader>
          
//           <CardContent className="p-0">
//             {loading ? (
//               <div className="flex flex-col items-center justify-center py-16">
//                 <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mb-4" />
//                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Fetching history...</p>
//               </div>
//             ) : paginatedTransactions.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-20 text-center px-4">
//                 <div className="h-16 w-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 ring-1 ring-gray-100 dark:ring-gray-700">
//                   <Wallet className="h-8 w-8 text-gray-300 dark:text-gray-600" />
//                 </div>
//                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No transactions found</h3>
//                 <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm font-medium">
//                   {filter === "success" ? "You don't have any successful transactions yet." : filter === "rejected" ? "No rejected transactions." : "Your wallet history is empty."}
//                 </p>
//               </div>
//             ) : (
//               <div>
//                 {/* Desktop Table View */}
//                 <div className="hidden lg:block overflow-x-auto">
//                   <Table>
//                     <TableHeader className="bg-transparent">
//                       <TableRow className="border-b border-gray-100 dark:border-gray-800">
//                         <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Date</TableHead>
//                         <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</TableHead>
//                         <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</TableHead>
//                         <TableHead className="py-4 pr-6 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {paginatedTransactions.map((txn) => {
//                         const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
//                         const isCredit = txn.type === "recharge" || txn.type === "credit";
                        
//                         return (
//                           <TableRow key={txn.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
//                             <TableCell className="pl-6 py-5 whitespace-nowrap">
//                               <div className="text-sm font-bold text-gray-900 dark:text-gray-200">
//                                 {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
//                               </div>
//                               <div className="text-xs font-medium text-gray-400 mt-0.5">
//                                 {new Date(txn.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
//                               </div>
//                             </TableCell>
//                             <TableCell className="py-5">
//                               <p className="font-bold text-gray-900 dark:text-white text-sm">{txn.description}</p>
//                               {txn.referenceId && <p className="text-[11px] text-gray-400 font-mono mt-1">Ref: {txn.referenceId}</p>}
//                               {txn.receiptUrl && (
//                                 <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline mt-1.5 inline-flex items-center">
//                                   View Receipt
//                                 </a>
//                               )}
//                             </TableCell>
//                             <TableCell className="py-5">
//                               <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
//                                 isSuccess
//                                   ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
//                                   : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
//                               }`}>
//                                 {isSuccess ? "Success" : txn.status}
//                               </span>
//                             </TableCell>
//                             <TableCell className="pr-6 py-5 text-right">
//                               <span className={`text-base font-extrabold tabular-nums ${
//                                 isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
//                               }`}>
//                                 {isCredit ? "+" : "-"} ₹{txn.amount.toFixed(2)}
//                               </span>
//                             </TableCell>
//                           </TableRow>
//                         )
//                       })}
//                     </TableBody>
//                   </Table>
//                 </div>

//                 {/* Mobile Cards View */}
//                 <div className="block lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
//                   {paginatedTransactions.map((txn) => {
//                     const isSuccess = txn.status.toLowerCase() === "completed" || txn.status.toLowerCase() === "success";
//                     const isCredit = txn.type === "recharge" || txn.type === "credit";

//                     return (
//                       <div key={txn.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
//                         <div className="flex justify-between items-start mb-2">
//                           <div className="flex flex-col">
//                            <span className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 pr-2 leading-snug">{txn.description}</span>
//                            <span className="text-xs font-medium text-gray-400 mt-1">
//                              {new Date(txn.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, {new Date(txn.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
//                            </span>
//                           </div>
//                           <span className={`text-base font-extrabold tabular-nums shrink-0 mt-0.5 ${
//                                 isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
//                               }`}>
//                             {isCredit ? "+" : "-"}₹{txn.amount.toFixed(2)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-end mt-3">
//                           <div className="flex flex-col gap-1.5">
//                             {txn.referenceId && <span className="text-[10px] text-gray-400 font-mono">Ref: {txn.referenceId}</span>}
//                             {txn.receiptUrl && (
//                                 <a href={txn.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
//                                   View Receipt
//                                 </a>
//                             )}
//                           </div>
//                           <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
//                                 isSuccess
//                                   ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
//                                   : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
//                               }`}>
//                             {isSuccess ? "Success" : txn.status}
//                           </span>
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </div>
                
//                 {/* Pagination Controls */}
//                 {totalPages > 1 && (
//                   <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
//                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
//                       Page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
//                     </span>
//                     <div className="flex gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                         disabled={currentPage === 1}
//                         className="h-8 w-8 p-0 rounded-lg cursor-pointer border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
//                       >
//                         <ChevronLeft className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//                         disabled={currentPage === totalPages}
//                         className="h-8 w-8 p-0 rounded-lg cursor-pointer border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
//                       >
//                         <ChevronRight className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }