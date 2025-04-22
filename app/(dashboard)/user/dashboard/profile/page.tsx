"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function UserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/user/profile")
      .then(res => setProfile(res.data.profile))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found.</div>;

  const { firstName, lastName, email, kycStatus, kycDetail } = profile;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* Profile Header */}
      <div className="flex items-center gap-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
          {firstName?.[0]}
        </div>
        <div>
          <div className="text-2xl font-bold">{firstName} {lastName}</div>
          <div className="text-gray-500">{email}</div>
          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            kycStatus === "Approved"
              ? "bg-green-100 text-green-700"
              : kycStatus === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}>
            KYC Status: {kycStatus}
          </div>
        </div>
      </div>

      {/* Company Info */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Company Information</h2>
        <div>Company Name: {kycDetail?.companyName || "-"}</div>
        <div>GST Number: {kycDetail?.gstNumber || "-"}</div>
        <div>Billing Address: {kycDetail?.billingAddress || "-"}</div>
        {/* ...aur fields... */}
      </section>

      {/* KYC Details */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">KYC Details</h2>
        <div>PAN: {kycDetail?.panCardNo || "-"}</div>
        <div>Aadhaar: {kycDetail?.aadhaarNo || "-"}</div>
        {/* ...uploads ke liye link ya icon... */}
      </section>

      {/* Bank Details */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Bank Details</h2>
        <div>Account Holder: {kycDetail?.accountHolder || "-"}</div>
        <div>Bank Name: {kycDetail?.bankName || "-"}</div>
        <div>Account No: {kycDetail?.accountNo || "-"}</div>
        <div>IFSC: {kycDetail?.ifsc || "-"}</div>
        {/* ...aur fields... */}
      </section>
    </div>
  );
}