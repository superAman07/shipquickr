"use client"

import type React from "react"
import { useState } from "react"
import { X, Wallet, ChevronDown, Percent, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"

interface RechargeModalProps {
    isOpen: boolean
    onCloseAction: () => void
    currentBalance: number
}

export default function RechargeModal({ isOpen, onCloseAction, currentBalance }: RechargeModalProps) {
    const [amount, setAmount] = useState<number>(200)
    const [showBillSummary, setShowBillSummary] = useState(false)
    const [showAllCoupons, setShowAllCoupons] = useState(false)
    const [loading, setLoading] = useState(false);

    const quickAmounts = [500, 1000, 2000, 5000]

    const handleAmountSelect = (selectedAmount: number) => {
        setAmount(selectedAmount)
    }

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number.parseInt(e.target.value) || 0
        setAmount(value)
    }

    const calculateCashback = () => {
        if (amount >= 200) {
            return Math.min(amount * 0.25, 50) // 25% cashback, max ₹50
        }
        return 0
    }

    const finalAmount = amount - calculateCashback()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Money</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recharge your wallet instantly</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full">
                            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-green-600 dark:text-green-400">₹{currentBalance.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={onCloseAction}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-full transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-6">
                    {/* Amount Input Section */}
                    <div className="space-y-4">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <div className="flex items-center justify-center">
                                    <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 mr-2">₹</span>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={handleCustomAmountChange}
                                        className="text-4xl font-bold text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-48"
                                        min="1"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mt-2"></div>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-4 gap-3">
                                {quickAmounts.map((quickAmount) => (
                                    <Button
                                        key={quickAmount}
                                        variant="outline"
                                        onClick={() => handleAmountSelect(quickAmount)}
                                        className={`py-3 px-4 rounded-2xl border-2 transition-all font-semibold ${amount === quickAmount
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        ₹{quickAmount}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Offers Section */}
                    {amount >= 200 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-xl">
                                        <Percent className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">FLAT50 Applied!</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Get ₹{calculateCashback()} cashback on this recharge
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                                    Applied
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View All Coupons */}
                    <button
                        onClick={() => setShowAllCoupons(!showAllCoupons)}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                    >
                        <Percent className="h-4 w-4" />
                        View All Offers
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAllCoupons ? "rotate-180" : ""}`} />
                    </button>

                    {showAllCoupons && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">WELCOME10</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">10% off on first recharge</div>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                                    Apply
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">SAVE20</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">₹20 off on recharge above ₹500</div>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-full bg-transparent" disabled={amount < 500}>
                                    {amount >= 500 ? "Apply" : "₹500 min"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Bill Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowBillSummary(!showBillSummary)}
                            className="flex items-center justify-between w-full"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                    <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900 dark:text-white">Amount to be credited</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{amount}</div>
                                </div>
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-500 transition-transform ${showBillSummary ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showBillSummary && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Recharge Amount</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">₹{amount}</span>
                                </div>
                                {calculateCashback() > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-600 dark:text-green-400">Cashback (FLAT50)</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">-₹{calculateCashback()}</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold text-gray-900 dark:text-white">You Pay</span>
                                    <span className="font-bold text-gray-900 dark:text-white">₹{finalAmount}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pay Button */}
                    <Button
                        className="w-full py-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await axios.post("/api/user/wallet", { amount: finalAmount });
                                if (res.data.success && res.data.redirectUrl) {
                                    window.location.href = res.data.redirectUrl;
                                } else {
                                    alert(res.data.error || "Failed to initiate payment.");
                                }
                            } catch (err) {
                                alert("Failed to initiate payment. Please try again.");
                            } finally {
                                setLoading(false);
                                //   onCloseAction() 
                            }
                        }}
                        disabled={amount < 200 || loading}
                    >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {loading ? "Processing..." : `Pay ₹${finalAmount}`}
                    </Button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Your payment is secured with 256-bit SSL encryption
                    </p>
                </div>
            </div>
        </div>
    )
}
