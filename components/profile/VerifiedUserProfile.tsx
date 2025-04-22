"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import Loading from "@/components/loading"

export default function VerifiedUserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get("/api/user/profile")
      .then((res) => setProfile(res.data.profile))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return <Loading/>

  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="p-6 text-center max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-gray-900 dark:text-gray-100 font-medium">Profile Not Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We couldn't retrieve your profile information. Please try again later.
          </p>
        </div>
      </div>
    )

  const { firstName, lastName, email, kycStatus, kycDetail } = profile

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
              {firstName?.[0]}
              {lastName?.[0]}
            </div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
              {firstName} {lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{email}</p>

            <div className="mt-4 w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">KYC Status</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    kycStatus?.toLowerCase() === "approved"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : kycStatus?.toLowerCase() === "pending"
                        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {kycStatus}
                </span>
              </div>

              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    kycStatus?.toLowerCase() === "approved"
                      ? "kycProgressBarApproved"
                      : kycStatus?.toLowerCase() === "pending"
                        ? "kycProgressBarPending"
                        : "kycProgressBarRejected"
                  }`}
                ></div>
              </div>
            </div>

            <div className="w-full border-t border-gray-100 dark:border-gray-700 mt-6 pt-6">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Mobile</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyContact || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Company</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyName || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyType || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        <div className="lg:col-span-2 space-y-6"> 
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">Company Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Company Name
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyName || "-"}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Company Email
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyEmail || "-"}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      GST Number
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {kycDetail?.gstNumber || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.website || "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Company Type
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyType || "-"}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Contact Number
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.companyContact || "-"}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Shipments</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.shipments || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Billing Address
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.billingAddress || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KYC Details */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">KYC Details</h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  kycStatus?.toLowerCase() === "approved"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : kycStatus?.toLowerCase() === "pending"
                      ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {kycStatus}
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      PAN Card Number
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {kycDetail?.panCardNo || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Aadhaar Number
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {kycDetail?.aadhaarNo || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {kycDetail?.aadhaarNo && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-500 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Aadhaar Verification Complete
                      </h3>
                      <div className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                        Your Aadhaar has been successfully verified through the official verification process.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Bank Details */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Bank Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Account Holder
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.accountHolder || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bank Name</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{kycDetail?.bankName || "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Account Number
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {kycDetail?.accountNo ? "•••• •••• " + kycDetail.accountNo.slice(-4) : "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">IFSC Code</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">{kycDetail?.ifsc || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
