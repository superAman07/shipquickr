import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import Loading from "@/components/loading";
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Edit3,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";

export default function VerifiedUserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolder: "",
    bankName: "",
    accountNo: "",
    ifsc: "",
    accountType: "saving",
    cheque: null as File | null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/user/profile");
      setProfile(res.data.profile);

      if (res.data.profile.kycDetail) {
        setBankForm({
          accountHolder: res.data.profile.kycDetail.accountHolder || "",
          bankName: res.data.profile.kycDetail.bankName || "",
          accountNo: res.data.profile.kycDetail.accountNo || "",
          ifsc: res.data.profile.kycDetail.ifsc || "",
          accountType: res.data.profile.kycDetail.accountType || "saving",
          cheque: null,
        });
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("accountHolder", bankForm.accountHolder);
      formData.append("bankName", bankForm.bankName);
      formData.append("accountNo", bankForm.accountNo);
      formData.append("ifsc", bankForm.ifsc);
      formData.append("accountType", bankForm.accountType);

      if (bankForm.cheque) {
        formData.append("cheque", bankForm.cheque);
      } else if (profile.kycDetail?.chequeUrl) {
        formData.append("existingChequeUrl", profile.kycDetail.chequeUrl);
      }

      await axios.put("/api/user/bank-details", formData);
      toast.success("Bank details updated successfully");
      setIsEditingBank(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Loading />;

  if (!profile)
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="max-w-md rounded-lg border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
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

          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Profile Not Found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We could not retrieve your profile information. Please try again later.
          </p>
        </div>
      </div>
    );

  const { firstName, lastName, email, kycDetail } = profile;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-12 md:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-indigo-100 bg-indigo-50 transition-transform hover:scale-105 dark:border-indigo-900/50 dark:bg-indigo-900/20">
                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  {firstName?.[0]}
                  {lastName?.[0]}
                </span>
              </div>

              <h2 className="mb-1 text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                {firstName} {lastName}
              </h2>
              <div className="mb-6 text-sm font-bold lowercase text-gray-500 dark:text-gray-400">
                {email}
              </div>

              <div className="w-full space-y-4 border-t border-gray-50 pt-6 dark:border-gray-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Mobile No
                  </span>
                  <span className="font-black text-gray-900 dark:text-gray-100">
                    {kycDetail?.companyContact || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Email ID
                  </span>
                  <span className="font-black text-gray-900 dark:text-gray-100">
                    {kycDetail?.companyEmail || "-"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    KYC Status
                  </span>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-900/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-700 dark:text-emerald-400">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-100/50 bg-indigo-50/50 p-6 dark:border-indigo-900/30 dark:bg-indigo-900/10">
            <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              ShipQuickr Partner
            </div>
            <p className="text-xs font-bold leading-relaxed text-indigo-900/60 dark:text-indigo-200/40">
              Your account is fully verified and ready for unlimited shipping
              operations.
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-900">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-white">
                Company Details
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {[
                  { label: "Company Name", value: kycDetail?.companyName },
                  { label: "Company Email", value: kycDetail?.companyEmail },
                  { label: "GST Number", value: kycDetail?.gstNumber, mono: true },
                  { label: "Website", value: kycDetail?.website },
                  { label: "Company Type", value: kycDetail?.companyType },
                  { label: "Contact Number", value: kycDetail?.companyContact },
                  { label: "Monthly Shipments", value: kycDetail?.shipments },
                  { label: "Billing Address", value: kycDetail?.billingAddress },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {field.label}
                    </label>

                    <div className="flex items-center justify-between">
                      <div
                        className={`text-sm font-bold text-gray-800 dark:text-gray-200 ${
                          field.mono ? "font-mono" : ""
                        }`}
                      >
                        {field.value || "Not Provided"}
                      </div>

                      {field.label === "GST Number" &&
                        kycDetail?.gstCertificateUrl && (
                          <Link
                            href={kycDetail.gstCertificateUrl}
                            target="_blank"
                            className="rounded-md bg-indigo-50 px-2 py-1 text-[9px] font-black uppercase text-indigo-600 transition hover:bg-indigo-100"
                          >
                            View Cert
                          </Link>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-900/30">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  Verification Documents
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    PAN Card Number
                  </label>
                  <div className="inline-block rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm font-black tracking-wider text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                    {kycDetail?.panCardNo || "-"}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Aadhaar Number
                  </label>
                  <div className="inline-block rounded-lg bg-indigo-50 px-3 py-2 font-mono text-sm font-black tracking-widest text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    {kycDetail?.aadhaarNo || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-50 pt-6 sm:grid-cols-3 dark:border-gray-700">
                {[
                  {
                    label: "PAN Card",
                    docType: "Identification Proof",
                    url: kycDetail?.panCardUrl,
                  },
                  {
                    label: "Aadhaar Front",
                    docType: "Address Proof",
                    url: kycDetail?.aadhaarFrontUrl,
                  },
                  {
                    label: "Aadhaar Back",
                    docType: "Address Proof",
                    url: kycDetail?.aadhaarBackUrl,
                  },
                  {
                    label: "Authorised Sign",
                    docType: "Signature",
                    url: kycDetail?.signatureUrl,
                  },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:bg-gray-800 dark:hover:shadow-none"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <CreditCard className="h-5 w-5 text-indigo-500" />
                      </div>

                      <div>
                        <div className="mb-1 text-[10px] font-black uppercase leading-none tracking-tighter text-gray-400">
                          {doc.docType}
                        </div>
                        <div className="text-xs font-black uppercase leading-none text-gray-900 dark:text-white">
                          {doc.label}
                        </div>
                      </div>
                    </div>

                    {doc.url ? (
                      <Link
                        href={doc.url}
                        target="_blank"
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="pl-1 text-[10px] font-black uppercase tracking-widest">
                          View Docs
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-100 p-2 opacity-50 dark:border-gray-800 dark:bg-gray-900">
                        <span className="pl-1 text-[10px] font-black uppercase tracking-widest">
                          Missing
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800/20 dark:bg-emerald-900/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-black uppercase leading-none text-emerald-900 dark:text-emerald-300">
                      Aadhaar E-Verified
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Successfully verified through NSDL systems.
                    </div>
                  </div>
                </div>

                <div className="hidden text-[22px] font-black tracking-widest text-emerald-900/10 sm:block dark:text-emerald-100/5">
                  {kycDetail?.aadhaarNo}
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/10 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-900">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-white">
                  Bank Settlement Details
                </h3>
              </div>

              {!isEditingBank ? (
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-1.5 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingBank(false)}
                    className="mr-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateBank}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50 dark:shadow-none"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {!isEditingBank ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <div className="mb-4">
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Account Holder
                      </label>
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {kycDetail?.accountHolder || "-"}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Bank Name
                      </label>
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {kycDetail?.bankName || "-"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Account Number
                      </label>
                      <div className="font-mono text-sm font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                        {kycDetail?.accountNo
                          ? "•••• •••• " + kycDetail.accountNo.slice(-4)
                          : "-"}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                        IFSC Code
                      </label>
                      <div className="font-mono text-sm font-black tracking-widest uppercase text-gray-800 dark:text-gray-200">
                        {kycDetail?.ifsc || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase text-gray-500">
                        Account Holder
                      </label>
                      <input
                        type="text"
                        value={bankForm.accountHolder}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            accountHolder: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Name as per bank"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase text-gray-500">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankForm.bankName}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            bankName: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Ex: HDFC Bank"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase text-gray-500">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankForm.accountNo}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            accountNo: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm font-black tracking-widest outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Enter account number"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase text-gray-500">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankForm.ifsc}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            ifsc: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm font-black tracking-[0.2em] uppercase outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Ex: HDFC0000123"
                      />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4 md:col-span-2 dark:border-gray-700">
                    <label className="mb-3 block text-[11px] font-black uppercase text-gray-500">
                      Cancelled Cheque OR Passbook Copy (Optional)
                    </label>

                    <div className="flex flex-col gap-4 md:flex-row">
                      <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-6 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-700">
                        {bankForm.cheque ? (
                          <div className="text-center">
                            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                            <div className="text-[10px] font-black uppercase text-green-600">
                              File Selected
                            </div>
                            <div className="mt-1 max-w-[200px] truncate text-[9px] text-gray-400">
                              {bankForm.cheque.name}
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="mb-2 h-8 w-8 text-gray-300 transition group-hover:text-indigo-500" />
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600">
                              Upload New File
                            </div>
                            <div className="mt-1 text-[9px] text-gray-400">
                              PDF, JPG, PNG up to 5MB
                            </div>
                          </>
                        )}

                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            setBankForm({
                              ...bankForm,
                              cheque: e.target.files?.[0] || null,
                            })
                          }
                        />
                      </label>

                      {kycDetail?.chequeUrl && (
                        <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                          <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Current Document
                          </div>

                          <Link
                            href={kycDetail.chequeUrl}
                            target="_blank"
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/40">
                                <Camera className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                View Cheque
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}