"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { format } from "date-fns"
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileText,
  IndianRupee,
  MapPin,
  Package,
  User,
  Wallet,
  X,
} from "lucide-react"

interface AdminUserDetailsSheetProps {
  userId: number | null
  isOpen: boolean
  onClose: () => void
}

export function AdminUserDetailsSheet({
  userId,
  isOpen,
  onClose,
}: AdminUserDetailsSheetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    "overview" | "company" | "finance" | "orders"
  >("overview")
  const [previewImage, setPreviewImage] = useState<{
    url: string
    title: string
  } | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true)
      setError(null)

      axios
        .get(`/api/admin/users/${userId}`)
        .then((res) => setData(res.data.data))
        .catch((err) =>
          setError(err.response?.data?.error || "Failed to load user details"),
        )
        .finally(() => setLoading(false))
    } else {
      setData(null)
      setActiveTab("overview")
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  const kyc = data?.kycDetail
  const wallet = data?.wallet

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-300 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold uppercase text-indigo-700 ring-4 ring-white shadow-sm dark:ring-slate-900">
              {data?.firstName ? data.firstName[0] : <User />}
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {data?.firstName} {data?.lastName}
                {data?.kycStatus === "approved" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{data?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-red-500">
            <AlertCircle className="mb-4 h-12 w-12 opacity-50" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tabs */}
            <div className="hide-scrollbar sticky top-0 z-10 flex overflow-x-auto border-b border-slate-200 bg-white px-6 pt-2 dark:border-slate-800 dark:bg-slate-950">
              <TabButton
                name="overview"
                icon={<User size={16} />}
                label="Overview"
                active={activeTab}
                set={setActiveTab}
              />
              <TabButton
                name="company"
                icon={<Briefcase size={16} />}
                label="Company & KYC"
                active={activeTab}
                set={setActiveTab}
              />
              <TabButton
                name="finance"
                icon={<Wallet size={16} />}
                label="Financials"
                active={activeTab}
                set={setActiveTab}
              />
              <TabButton
                name="orders"
                icon={<Package size={16} />}
                label="Recent Orders"
                active={activeTab}
                set={setActiveTab}
              />
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="Total Shipments"
                      value={data.totalOrders?.toString() || "0"}
                      icon={<Package className="text-blue-500" />}
                    />
                    <StatCard
                      title="Wallet Balance"
                      value={`₹${wallet?.balance?.toFixed(2) || "0.00"}`}
                      icon={<IndianRupee className="text-green-500" />}
                    />
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                      <User className="h-5 w-5 text-indigo-500" />
                      Profiling Details
                    </h3>

                    <DetailRow label="Account ID" value={`#USR-${data.id}`} />
                    <DetailRow label="Mobile Number" value={data.mobile || "N/A"} />
                    <DetailRow
                      label="Joined Date"
                      value={format(new Date(data.createdAt), "PPP p")}
                    />
                    <DetailRow
                      label="Status"
                      value={data.status ? "Active Participant" : "Suspended"}
                    />
                    <DetailRow label="KYC Phase" value={data.kycStatus.toUpperCase()} />
                  </div>
                </div>
              )}

              {/* COMPANY & KYC TAB */}
              {activeTab === "company" && (
                <div className="space-y-6">
                  {kyc ? (
                    <>
                      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <Briefcase className="h-5 w-5 text-indigo-500" />
                          Business Identity
                        </h3>

                        <DetailRow label="Company Name" value={kyc.companyName} />
                        <DetailRow label="Company Email" value={kyc.companyEmail} />
                        <DetailRow label="Contact" value={kyc.companyContact} />
                        <DetailRow label="Website" value={kyc.website || "N/A"} />
                        <DetailRow label="GST Registered" value={kyc.gst ? "Yes" : "No"} />
                        {kyc.gst && <DetailRow label="GST Number" value={kyc.gstNumber} />}
                      </div>

                      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <MapPin className="h-5 w-5 text-indigo-500" />
                          Billing Address
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {kyc.billingAddress}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {kyc.city}, {kyc.state} - {kyc.pincode}
                        </p>
                      </div>

                      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <FileText className="h-5 w-5 text-indigo-500" />
                          KYC Documents
                        </h3>

                        <DetailRow label="PAN Number" value={kyc.panCardNo} />
                        <DetailRow label="Aadhaar Number" value={kyc.aadhaarNo} />

                        <div className="mt-4 flex flex-wrap gap-3">
                          {kyc.panCardUrl && (
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: kyc.panCardUrl,
                                  title: "PAN Card",
                                })
                              }
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              View PAN Card
                            </button>
                          )}

                          {kyc.aadhaarFrontUrl && (
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: kyc.aadhaarFrontUrl,
                                  title: "Aadhaar Front",
                                })
                              }
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              View Aadhaar Front
                            </button>
                          )}

                          {kyc.gstCertificateUrl && (
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: kyc.gstCertificateUrl,
                                  title: "GST Certificate",
                                })
                              }
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              View GST Cert
                            </button>
                          )}

                          {kyc.chequeUrl && (
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: kyc.chequeUrl,
                                  title: "Cancelled Cheque",
                                })
                              }
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              View Cancelled Cheque
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p>This user has not submitted KYC details yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* FINANCE TAB */}
              {activeTab === "finance" && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 p-6 text-white shadow-md">
                    <p className="mb-1 text-sm font-medium text-indigo-200">
                      Current Wallet Balance
                    </p>
                    <h2 className="text-4xl font-bold tracking-tight">
                      ₹{wallet?.balance?.toFixed(2) || "0.00"}
                    </h2>
                    <p className="mt-2 text-xs text-indigo-200 opacity-80">
                      Last synced:{" "}
                      {wallet?.updatedAt ? format(new Date(wallet.updatedAt), "PPp") : "Never"}
                    </p>
                  </div>

                  <h3 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    Recent Wallet Transactions
                  </h3>

                  {data.transactions && data.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {data.transactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div>
                            <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                              {tx.type}
                              <span className="ml-2 text-xs font-normal tracking-normal text-slate-500">
                                #{tx.merchantTransactionId || tx.id}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {format(new Date(tx.createdAt), "PP p")}
                            </p>
                          </div>

                          <div
                            className={`font-bold ${
                              tx.type === "recharge" ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {tx.type === "recharge" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-slate-500">
                      No recent transactions found.
                    </p>
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  <h3 className="mb-2 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    Recent Shipments ({data._count?.orders || 0})
                  </h3>

                  {data.orders && data.orders.length > 0 ? (
                    <div className="space-y-3">
                      {data.orders.map((o: any) => (
                        <div
                          key={o.id}
                          className="cursor-default rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <p className="font-bold tracking-tight text-slate-800 dark:text-slate-200">
                                {o.orderId}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(o.createdAt), "PP p")}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {o.status}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                            <span>
                              To: {o.customerName} ({o.city})
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Cost: ₹{o.shippingCost || "0.00"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p>User hasn't placed any orders yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {previewImage.title}
                </h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-slate-100 p-4 dark:bg-slate-900">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  name,
  label,
  icon,
  active,
  set,
}: {
  name: any
  label: string
  icon: React.ReactNode
  active: any
  set: any
}) {
  const isActive = active === name

  return (
    <button
      onClick={() => set(name)}
      className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {icon} {label}
    </button>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div>
        <p className="mb-1 text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
        {icon}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="grid grid-cols-3 items-start gap-2 py-1">
      <span className="col-span-1 text-sm font-medium text-slate-500">{label}</span>
      <span className="col-span-2 break-all text-sm text-slate-800 dark:text-slate-200">
        {value}
      </span>
    </div>
  )
}