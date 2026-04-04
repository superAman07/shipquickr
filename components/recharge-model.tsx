"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Wallet, ChevronDown, Percent, CreditCard, TicketIcon, PlusCircle, CheckCircle2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

interface RechargeModalProps {
    isOpen: boolean
    onCloseAction: () => void
    currentBalance: number
}

interface Coupon {
    id: number;
    name: string;
    code: string;
    condition: string | null;
    amount: number;
    amountType: 'fixed' | 'percent';
}

export default function RechargeModal({ isOpen, onCloseAction, currentBalance }: RechargeModalProps) {
    const [amount, setAmount] = useState<number>(200)
    const [showBillSummary, setShowBillSummary] = useState(false)
    const [showAllCoupons, setShowAllCoupons] = useState(false)
    const [loading, setLoading] = useState(false);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const quickAmounts = [500, 1000, 2000, 5000]

    useEffect(() => {
        if (isOpen) {
            axios.get("/api/user/wallet/coupons")
                .then(res => {
                    if (res.data.success) {
                        setCoupons(res.data.coupons);
                    }
                })
                .catch(console.error);
        } else {
            setAppliedCoupon(null);
            setShowAllCoupons(false);
            setAmount(200);
        }
    }, [isOpen]);

    const handleAmountSelect = (selectedAmount: number) => {
        setAmount(selectedAmount)
    }

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number.parseInt(e.target.value) || 0
        setAmount(value)
    }

    const toggleCoupon = (coupon: Coupon) => {
        if (appliedCoupon?.id === coupon.id) {
            setAppliedCoupon(null);
        } else {
            setAppliedCoupon(coupon);
        }
        setShowAllCoupons(false);
    }

    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.amountType === 'percent') {
            return (amount * appliedCoupon.amount) / 100;
        }
        return appliedCoupon.amount;
    }

    const discountValue = calculateDiscount();

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onCloseAction}>
            <div 
              className="bg-gradient-to-br from-[#05061c] via-[#0a0c37] to-[#05061c] rounded-3xl w-full max-w-[50vh] mx-auto h-auto max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(10,12,55,0.6)] border border-white/10 relative" 
              onClick={(e) => e.stopPropagation()}
            >
                {/* Header background accent */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-3xl"></div>

                <div className="flex items-start justify-between pt-6 pl-6 pr-6 pb-2 relative z-10">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">Fund Wallet</h2>
                        <p className="text-sm text-blue-200/60 mt-1">Add money securely to your account</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-inner">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                            <span className="font-bold text-emerald-400">₹{currentBalance.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onCloseAction}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white cursor-pointer rounded-full transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-6 relative z-10 mt-4">
                    {/* Amount Input Section */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-inner backdrop-blur-sm mx-1">
                        <div className="text-center space-y-4">
                            <div className="flex flex-col items-center justify-center relative">
                                <div className="flex items-center text-white/50 mb-1 font-bold uppercase tracking-widest text-[11px]">
                                    Enter Amount
                                </div>
                                <div className="flex items-center justify-center group">
                                    <span className="text-3xl font-light text-white/40 mr-1.5 group-focus-within:text-blue-400 transition-colors">₹</span>
                                    <Input
                                        type="number"
                                        value={amount || ""}
                                        onChange={handleCustomAmountChange}
                                        className="text-5xl font-extrabold text-center text-white border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-44 transition-all"
                                        min="1"
                                        placeholder="0"
                                    />
                                </div>
                                {amount > 0 && amount < 200 && (
                                    <div className="mt-4 text-xs font-bold tracking-wide text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-md">
                                        Minimum recharge amount is ₹200.
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                {quickAmounts.map((quickAmount) => (
                                    <button
                                        key={quickAmount}
                                        onClick={() => handleAmountSelect(quickAmount)}
                                        className={`py-2.5 px-2 rounded-xl border transition-all cursor-pointer font-bold text-sm ${
                                          amount === quickAmount
                                            ? "border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.03]"
                                            : "border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                                        }`}
                                    >
                                        +₹{quickAmount}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Offers Section */}
                    {coupons.length > 0 && (
                      <div className="space-y-3">
                        <button
                            onClick={() => setShowAllCoupons(!showAllCoupons)}
                            className="flex items-center justify-between w-full bg-blue-900/30 border border-blue-500/20 p-4 rounded-2xl hover:bg-blue-900/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2.5 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Percent className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-[15px] tracking-tight">
                                      {appliedCoupon ? "Coupon Applied!" : "Offers & Promocodes"}
                                    </div>
                                    <div className="text-xs text-blue-200/70 font-semibold mt-0.5">
                                      {appliedCoupon 
                                        ? `You got ₹${discountValue} benefit` 
                                        : `${coupons.length} offers available for you`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                               {appliedCoupon && <span className="text-[11px] font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 line-clamp-1 max-w-[80px]">{appliedCoupon.code}</span>}
                               <ChevronDown className={`h-5 w-5 text-blue-300/50 group-hover:text-blue-300 transition-transform duration-300 ${showAllCoupons ? "rotate-180" : ""}`} />
                            </div>
                        </button>

                        {showAllCoupons && (
                            <div className="bg-black/30 rounded-2xl p-2.5 space-y-2 border border-white/5 max-h-[220px] overflow-y-auto hidden-scrollbar">
                                {coupons.map(coupon => (
                                  <div key={coupon.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 relative overflow-hidden group">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                      <div className="mb-3 sm:mb-0 ml-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-black text-white tracking-widest uppercase text-sm">{coupon.code}</span>
                                            {appliedCoupon?.id === coupon.id && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                                          </div>
                                          <div className="text-[11px] text-white/50 mt-1 max-w-[200px] leading-snug font-medium">{coupon.name}</div>
                                          {coupon.condition && <div className="text-[10px] text-white/30 font-semibold mt-1 uppercase tracking-wider">{coupon.condition}</div>}
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => toggleCoupon(coupon)}
                                        className={`rounded-xl border font-bold text-xs px-4 transition-all ${appliedCoupon?.id === coupon.id ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30 hover:text-rose-200" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white"}`}
                                      >
                                          {appliedCoupon?.id === coupon.id ? "REMOVE" : "APPLY"}
                                      </Button>
                                  </div>
                                ))}
                            </div>
                        )}
                      </div>
                    )}

                    {/* Bill Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all">
                        <button
                            onClick={() => setShowBillSummary(!showBillSummary)}
                            className="flex items-center justify-between w-full group outline-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
                                    <CreditCard className="h-5 w-5 text-blue-200" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Amount to pay</div>
                                    <div className="text-xl font-black text-white">₹{amount}</div>
                                </div>
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 text-white/40 group-hover:text-white/80 transition-transform duration-300 ${showBillSummary ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showBillSummary && (
                            <div className="mt-5 pt-4 border-t border-white/10 space-y-3.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/60 font-medium">Recharge Amount</span>
                                    <span className="font-bold text-white">₹{amount}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-400 font-medium">Coupon Benefit ({appliedCoupon.code})</span>
                                        <span className="font-bold text-emerald-400">+{discountValue.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-white/10"></div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-black text-white text-lg tracking-tight">Total Credited</span>
                                    <span className="font-black text-emerald-300 text-xl tracking-tight">₹{(amount + (appliedCoupon ? discountValue : 0)).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pay Button */}
                    <Button
                        className="w-full py-7 text-lg cursor-pointer font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-[0_8px_25px_rgba(37,99,235,0.35)] disabled:opacity-50 transition-all duration-300 border-none outline-none relative overflow-hidden group"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const payload = { amount, couponCode: appliedCoupon?.code };
                                const res = await axios.post("/api/user/wallet", payload);
                                if (res.data.success && res.data.redirectUrl) {
                                    window.location.href = res.data.redirectUrl;
                                } else {
                                    alert(res.data.error || "Failed to initiate payment.");
                                }
                            } catch (err) {
                                alert("Failed to initiate payment. Please try again.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={amount < 200 || loading}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-700 -translate-x-[200%] skew-x-12"></div>
                        <CreditCard className="h-6 w-6 mr-3 relative z-10" />
                        <span className="relative z-10 tracking-wide">{loading ? "PROCESSING..." : `PAY SECURELY ₹${amount}`}</span>
                    </Button>

                    <div className="flex justify-center items-center gap-2 pt-1 opacity-60">
                        <Lock className="h-3.5 w-3.5 text-blue-200" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">256-bit SSL encrypted</span>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .hidden-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hidden-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </div>
    )
}


// "use client"

// import type React from "react"
// import { useState } from "react"
// import { X, Wallet, ChevronDown, Percent, CreditCard } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import axios from "axios"

// interface RechargeModalProps {
//     isOpen: boolean
//     onCloseAction: () => void
//     currentBalance: number
// }

// export default function RechargeModal({ isOpen, onCloseAction, currentBalance }: RechargeModalProps) {
//     const [amount, setAmount] = useState<number>(200)
//     const [showBillSummary, setShowBillSummary] = useState(false)
//     const [showAllCoupons, setShowAllCoupons] = useState(false)
//     const [loading, setLoading] = useState(false);

//     const quickAmounts = [500, 1000, 2000, 5000]

//     const handleAmountSelect = (selectedAmount: number) => {
//         setAmount(selectedAmount)
//     }

//     const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = Number.parseInt(e.target.value) || 0
//         setAmount(value)
//     }

//     const calculateCashback = () => {
//         if (amount >= 200) {
//             return Math.min(amount * 0.25, 50)
//         }
//         return 0
//     }

//     const finalAmount = amount - calculateCashback()

//     if (!isOpen) return null

//     return (
//         <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCloseAction}>
//             <div className="bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:bg-[#495057] rounded-3xl w-full max-w-[50vh] mx-auto h-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>

//                 <div className="flex items-start justify-between pt-6 pl-6 pr-6 pb-0">
//                     <div>
//                         <h2 className="text-xl font-bold text-[#495057] dark:text-white">Add Money</h2>
//                     </div>
//                     <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
//                             <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
//                             <span className="font-semibold text-green-600 dark:text-green-400">₹{currentBalance.toFixed(2)}</span>
//                         </div>
//                         <button
//                             onClick={onCloseAction}
//                             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-full transition-colors"
//                         >
//                             <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
//                         </button>
//                     </div>
//                 </div>
//                 <p className="pl-6 pb-4 text-sm text-gray-500 dark:text-gray-400 mt-1">Recharge your wallet instantly</p>

//                 <div className="px-6 pb-6 space-y-6">
//                     {/* Amount Input Section */}
//                     <div className="space-y-4">
//                         <div className="text-center space-y-4">
//                             <div className="relative">
//                                 <div className="flex items-center justify-center">
//                                     <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 mr-2">₹</span>
//                                     <Input
//                                         type="number"
//                                         value={amount}
//                                         onChange={handleCustomAmountChange}
//                                         className="text-4xl font-bold text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-48"
//                                         min="1"
//                                         placeholder="0"
//                                     />
//                                 </div>
//                                 {amount > 0 && amount < 200 && (
//                                     <div className="mt-2 text-sm text-red-600 dark:text-red-400">
//                                         Minimum recharge amount is ₹200.
//                                     </div>
//                                 )}
//                                 <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mt-2"></div>
//                             </div>

//                             {/* Quick Amount Buttons */}
//                             <div className="grid grid-cols-4 gap-3">
//                                 {quickAmounts.map((quickAmount) => (
//                                     <Button
//                                         key={quickAmount}
//                                         variant="outline"
//                                         onClick={() => handleAmountSelect(quickAmount)}
//                                         className={`py-3 px-4 rounded-2xl border-2 transition-all cursor-pointer font-semibold ${amount === quickAmount
//                                             ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
//                                             : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
//                                             }`}
//                                     >
//                                         ₹{quickAmount}
//                                     </Button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                     {/* Bill Summary */}
//                     <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
//                         <button
//                             onClick={() => setShowBillSummary(!showBillSummary)}
//                             className="flex items-center justify-between w-full"
//                         >
//                             <div className="flex items-center gap-3">
//                                 <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
//                                     <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//                                 </div>
//                                 <div className="text-left">
//                                     <div className="font-semibold text-[#495057] dark:text-white">Amount to be credited</div>
//                                     <div className="text-2xl font-bold text-[#495057] dark:text-white">₹{amount}</div>
//                                 </div>
//                             </div>
//                             <ChevronDown
//                                 className={`h-5 w-5 text-gray-500 cursor-pointer transition-transform ${showBillSummary ? "rotate-180" : ""}`}
//                             />
//                         </button>

//                         {showBillSummary && (
//                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
//                                 <div className="flex justify-between items-center">
//                                     <span className="text-gray-600 dark:text-gray-400">Recharge Amount</span>
//                                     <span className="font-semibold text-[#495057] dark:text-white">₹{amount}</span>
//                                 </div>
//                                 {calculateCashback() > 0 && (
//                                     <div className="flex justify-between items-center">
//                                         <span className="text-green-600 dark:text-green-400">Cashback (FLAT50)</span>
//                                         <span className="font-semibold text-green-600 dark:text-green-400">0(not yet)</span>
//                                         {/* <span className="font-semibold text-green-600 dark:text-green-400">-₹{calculateCashback()}</span> */}
//                                     </div>
//                                 )}
//                                 <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
//                                 <div className="flex justify-between items-center text-lg">
//                                     <span className="font-bold text-[#495057] dark:text-white">You Pay</span>
//                                     <span className="font-bold text-[#495057] dark:text-white">₹{amount}</span>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* Pay Button */}
//                     <Button
//                         className="w-full py-4 text-lg cursor-pointer font-bold bg-gradient-to-r from-[#0a0c37] to-[#4349b6] hover:from-[#0b0e46] hover:to-[#3d44c1] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
//                         onClick={async () => {
//                             setLoading(true);
//                             try {
//                                 const res = await axios.post("/api/user/wallet", { amount });
//                                 if (res.data.success && res.data.redirectUrl) {
//                                     window.location.href = res.data.redirectUrl;
//                                 } else {
//                                     alert(res.data.error || "Failed to initiate payment.");
//                                 }
//                             } catch (err) {
//                                 alert("Failed to initiate payment. Please try again.");
//                             } finally {
//                                 setLoading(false);
//                                 //   onCloseAction() 
//                             }
//                         }}
//                         disabled={amount < 200 || loading}
//                     >
//                         <CreditCard className="h-5 w-5 mr-2" />
//                         {loading ? "Processing..." : `Pay ₹${amount}`}
//                     </Button>

//                     <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
//                         Your payment is secured with 256-bit SSL encryption
//                     </p>
//                 </div>
//             </div>
//         </div>
//     )
// }
