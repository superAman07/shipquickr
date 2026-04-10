"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
    X,
    Wallet,
    ChevronDown,
    Percent,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface RechargeModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    currentBalance: number;
}

interface Coupon {
    id: number;
    name: string;
    code: string;
    condition: string | null;
    amount: number;
    amountType: "fixed" | "percent";
}

export default function RechargeModal({
    isOpen,
    onCloseAction,
    currentBalance,
}: RechargeModalProps) {
    const [amount, setAmount] = useState<number>(200);
    const [showBillSummary, setShowBillSummary] = useState(false);
    const [showAllCoupons, setShowAllCoupons] = useState(false);
    const [loading, setLoading] = useState(false);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const quickAmounts = [500, 1000, 2000, 5000];

    useEffect(() => {
        if (isOpen) {
            axios
                .get("/api/user/wallet/coupons")
                .then((res) => {
                    if (res.data.success) {
                        setCoupons(res.data.coupons);
                    }
                })
                .catch(console.error);
        } else {
            setAppliedCoupon(null);
            setShowAllCoupons(false);
            setShowBillSummary(false);
            setAmount(200);
        }
    }, [isOpen]);

    const handleAmountSelect = (selectedAmount: number) => {
        setAmount(selectedAmount);
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number.parseInt(e.target.value) || 0;
        setAmount(value);
    };

    const toggleCoupon = (coupon: Coupon) => {
        if (appliedCoupon?.id === coupon.id) {
            setAppliedCoupon(null);
        } else {
            setAppliedCoupon(coupon);
        }
        setShowAllCoupons(false);
    };

    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.amountType === "percent") {
            return (amount * appliedCoupon.amount) / 100;
        }
        return appliedCoupon.amount;
    };

    const discountValue = calculateDiscount();
    const firstCoupon = coupons.length > 0 ? coupons[0] : null;

    if (!isOpen) return null;

    return (
        <div
      className= "fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
    onClick = { onCloseAction }
        >
        <div
        className="relative w-full max-w-[480px] rounded-2xl bg-white shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]"
    onClick = {(e) => e.stopPropagation()
}
      >
    {/* Close button — inside card, top-right corner */ }
    < button
onClick = { onCloseAction }
className = "absolute top-4 right-4 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
    >
    <X className="h-4 w-4" />
        </button>

{/* ── Header ── */ }
<div className="flex items-center justify-between px-7 pt-5 pb-0" >
    <h2 className="text-[17px] font-bold tracking-tight text-gray-800" >
        Recharge Your Wallet
            </h2>
            < div className = "mr-8 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px]" >
                <Wallet className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-600" >
              ₹{ currentBalance.toFixed(2) }
</span>
    </div>
    </div>

{/* ── Amount Section ── */ }
<div className="px-7 pt-5 pb-1 text-center" >
    <p className="mb-2 text-[13px] text-gray-500" > Enter Amount to Add </p>

        < div className = "relative mx-auto mb-4 inline-flex items-baseline gap-1" >
            <span className="text-[22px] font-medium text-gray-400" >₹</span>
                < input
type = "number"
value = { amount || ""}
onChange = { handleCustomAmountChange }
className = "w-28 border-none bg-transparent text-center text-[34px] font-bold text-gray-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
min = "1"
placeholder = "0"
    />
    { amount > 0 && (
        <button
                onClick={ () => setAmount(0) }
className = "absolute -right-5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-300 transition-colors hover:text-gray-500"
    >
    <X className="h-3.5 w-3.5" />
        </button>
            )}
</div>

{
    amount > 0 && amount < 200 && (
        <p className="-mt-1 mb-2 text-[11px] font-medium text-rose-500" >
            Minimum recharge amount is ₹200
                </p>
          )
}

{/* Dashed separator */ }
<div className="mx-auto mb-4 border-t border-dashed border-gray-200" />

    {/* Quick amount pills */ }
    < div className = "flex justify-center gap-2" >
    {
        quickAmounts.map((q) => (
            <button
                key= { q }
                onClick = {() => handleAmountSelect(q)}
className = {`cursor-pointer rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${amount === q
        ? "border-indigo-500 bg-indigo-50 text-indigo-600"
        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
    }`}
              >
                ₹{ q }
</button>
            ))}
</div>
    </div>

{/* ── Offers & Bill Summary ── */ }
<div className="px-7 pt-4 pb-1" >
    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400" >
        Offers & Bill Summary
            </p>

{/* Primary coupon — ticket card with half-circle cuts (only if coupons exist) */ }
{
    firstCoupon && (
        <div className="relative mb-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-3" >
            {/* Left half-circle notch */ }
            < div className = "absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-[inset_-1px_0_0_0_rgb(219,234,254)]" />
                {/* Right half-circle notch */ }
                < div className = "absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-[inset_1px_0_0_0_rgb(219,234,254)]" />

                    <div className="flex items-start gap-3" >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 shadow-sm" >
                            <Percent className="h-3 w-3 text-white" />
                                </div>
                                < div className = "min-w-0 flex-1" >
                                    <div className="flex items-center justify-between" >
                                        <span className="text-[13px] font-bold text-gray-800" >
                                            { firstCoupon.code }
                                            </span>
                                            < button
    onClick = {() => toggleCoupon(firstCoupon)
}
className = "cursor-pointer text-[13px] font-bold text-indigo-600 hover:text-indigo-700"
    >
    { appliedCoupon?.id === firstCoupon.id ? "Remove" : "Apply"}
</button>
    </div>
    < p className = "mt-0.5 text-[11px] leading-snug text-gray-500" >
        { firstCoupon.name }
        </p>

{
    coupons.length > 1 && (
        <button
                      onClick={ () => setShowAllCoupons(!showAllCoupons) }
    className = "mt-1 flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-gray-400 hover:text-gray-600"
        >
    {
        showAllCoupons
        ? "Hide Coupons"
            : `+${coupons.length - 1} More Offer${coupons.length - 1 > 1 ? "s" : ""}`
    }
        < ChevronDown
    className = {`h-3 w-3 transition-transform ${showAllCoupons ? "rotate-180" : ""}`
}
                      />
    </button>
                  )}

{
    firstCoupon.condition && (
        <p className="mt-1.5 text-[9px] italic text-gray-400" >
            { firstCoupon.condition }
            </p>
                  )
}
</div>
    </div>
    </div>
          )}

{/* Expanded coupon list */ }
{
    showAllCoupons && coupons.length > 1 && (
        <div className="mb-3 space-y-1.5" >
        {
            coupons.slice(1).map((coupon) => (
                <div
                  key= { coupon.id }
                  className = "relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50/80 px-5 py-2.5"
                >
                {/* Left notch */ }
                < div className = "absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[inset_-1px_0_0_0_rgb(243,244,246)]" />
                {/* Right notch */ }
                < div className = "absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[inset_1px_0_0_0_rgb(243,244,246)]" />

                <div className="flex items-center justify-between" >
            <div>
            <div className="flex items-center gap-1.5" >
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-gray-700" >
            { coupon.code }
            </span>
                        { appliedCoupon?.id === coupon.id && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )
        }
            </div>
            < p className = "mt-0.5 text-[10px] text-gray-400" >
                { coupon.name }
                </p>
                </div>
                < button
    onClick = {() => toggleCoupon(coupon)
}
className = {`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${appliedCoupon?.id === coupon.id
        ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
        : "text-indigo-600 hover:bg-indigo-50"
    }`}
                    >
    { appliedCoupon?.id === coupon.id ? "Remove" : "Apply"}
</button>
    </div>
    </div>
              ))}
</div>
          )}

{/* No coupons placeholder */ }
{
    coupons.length === 0 && (
        <div className="mb-3 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-center" >
            <p className="text-[12px] text-gray-400" > No coupons available </p>
                </div>
          )
}

{/* ── Amount to be credited row ── */ }
<div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3.5 py-2.5" >
    <div className="flex items-center gap-2" >
        <Wallet className="h-4 w-4 text-gray-400" />
            <span className="text-[12px] text-gray-500" >
                Amount to be credited:
<strong className="ml-1 text-gray-800" >
                  ₹{ amount + (appliedCoupon ? discountValue : 0) }
</strong>
    </span>
    </div>
    < button
onClick = {() => setShowBillSummary(!showBillSummary)}
className = "flex cursor-pointer items-center gap-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-700"
    >
    View Bill Summary
        < ChevronDown
className = {`h-3 w-3 transition-transform ${showBillSummary ? "rotate-180" : ""}`}
              />
    </button>
    </div>

{
    showBillSummary && (
        <div className="mt-1.5 space-y-2 rounded-lg bg-gray-50 px-4 py-3 text-[12px]" >
            <div className="flex justify-between" >
                <span className="text-gray-500" > Recharge Amount </span>
                    < span className = "font-semibold text-gray-700" >₹{ amount } </span>
                        </div>
    {
        appliedCoupon && (
            <div className="flex justify-between" >
                <span className="text-emerald-600" >
                    Coupon({ appliedCoupon.code })
                    </span>
                    < span className = "font-semibold text-emerald-600" >
                        +₹{ discountValue.toFixed(0) }
        </span>
            </div>
              )
    }
    <div className="h-px bg-gray-200" />
        <div className="flex justify-between text-[13px]" >
            <span className="font-bold text-gray-700" > You Pay </span>
                < span className = "font-bold text-gray-900" >₹{ amount } </span>
                    </div>
                    </div>
          )
}
</div>

{/* ── Pay Button ── */ }
<div className="px-7 pt-3 pb-5" >
    <Button
            className="w-full cursor-pointer rounded-xl border-none bg-[#5b51d8] py-6 text-[15px] font-bold text-white shadow-[0_4px_14px_0_rgba(91,81,216,0.39)] transition-all hover:-translate-y-[1px] hover:bg-[#4338ca] hover:shadow-[0_6px_20px_rgba(91,81,216,0.23)] disabled:opacity-40 disabled:hover:translate-y-0"
onClick = { async() => {
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
disabled = { amount< 200 || loading }
    >
    { loading? "Processing...": `Pay ₹${amount}` }
    </Button>
    </div>
    </div>
    </div>
  );
}