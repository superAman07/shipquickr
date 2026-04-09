"use client"

import { useEffect, useState } from "react"
import type React from "react"
import {
  Check,
  Upload,
  Building2,
  User,
  CreditCard,
  FileText,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { toast } from "react-toastify"
import ButtonLoading from "@/components/buttonLoading"
import useSWR from "swr"

interface KycStatusResponse {
  kycStatus?: string
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function KYC() {
  const [currentStep, setCurrentStep] = useState(0)

  const [isEditingMobile, setIsEditingMobile] = useState(false)
  const [mobileLoading, setMobileLoading] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isUserDataLoading, setIsUserDataLoading] = useState(true)

  const [form, setForm] = useState({
    firstName: "Loading...",
    lastName: "Loading...",
    email: "Loading...",
    mobile: "Loading...",
    companyType: "",
    panCardNo: "",
    panCardFile: null as File | null,
    aadhaarNo: "",
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null,
    accountHolder: "",
    bankName: "",
    accountType: "",
    accountNo: "",
    reAccountNo: "",
    ifsc: "",
    cheque: null as File | null,
    gst: "yes",
    gstNumber: "",
    gstCertificate: null as File | null,
    shipments: "",
    companyName: "",
    companyEmail: "",
    companyContact: "",
    billingAddress: "",
    pincode: "",
    state: "",
    city: "",
    website: "",
    signature: null as File | null,
    companyLogo: null as File | null,
  })

  const {
    data: kycData,
    error: kycError,
    isLoading: isKycStatusLoading,
  } = useSWR<KycStatusResponse>("/api/user/kyc", fetcher, {
    refreshInterval: 30000,
  })

  const currentUserKycStatus = isKycStatusLoading
    ? "loading"
    : kycError
      ? "none"
      : kycData?.kycStatus?.toLowerCase() || "none"

  useEffect(() => {
    if (isUserDataLoading) return

    const draftContent = { ...form }

    delete (draftContent as any).panCardFile
    delete (draftContent as any).aadhaarFront
    delete (draftContent as any).aadhaarBack
    delete (draftContent as any).cheque
    delete (draftContent as any).gstCertificate
    delete (draftContent as any).signature
    delete (draftContent as any).companyLogo

    localStorage.setItem("kyc_draft_v1", JSON.stringify(draftContent))
  }, [form, isUserDataLoading])

  useEffect(() => {
    const fetchUserData = async () => {
      setIsUserDataLoading(true)

      try {
        const response = await axios.get("/api/user/profile")
        const user = response.data.profile

        const draft = localStorage.getItem("kyc_draft_v1")
        const parsedDraft = draft ? JSON.parse(draft) : {}

        setForm((prevForm) => ({
          ...prevForm,
          ...parsedDraft,
          firstName:
            parsedDraft.firstName && parsedDraft.firstName !== "Loading..."
              ? parsedDraft.firstName
              : user.firstName || "",
          lastName:
            parsedDraft.lastName && parsedDraft.lastName !== "Loading..."
              ? parsedDraft.lastName
              : user.lastName || "",
          email:
            parsedDraft.email && parsedDraft.email !== "Loading..."
              ? parsedDraft.email
              : user.email || "",
          mobile:
            parsedDraft.mobile && parsedDraft.mobile !== "Loading..."
              ? parsedDraft.mobile
              : user.mobile || "",
        }))
      } catch (error) {
        console.error("Failed to fetch user data:", error)

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Session expired or invalid. Please log in again.")
        }
      } finally {
        setIsUserDataLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value
    setForm((f) => ({ ...f, pincode }))

    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        const data = await res.json()

        if (data[0].Status === "Success") {
          setForm((f) => ({
            ...f,
            state: data[0].PostOffice[0].State,
            city: data[0].PostOffice[0].District,
          }))
        }
      } catch {}
    }
  }

  const validateAndSetFile = (file: File | undefined, key: keyof typeof form) => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 2MB limit! Please upload a smaller file.")
      return
    }

    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Only JPEG, PNG, or PDF files are allowed!")
      return
    }

    setForm((prev) => ({ ...prev, [key]: file }))
  }

  const isStep1Valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.mobile.trim()

  const isStep2Valid =
    form.companyName.trim() &&
    form.companyEmail.trim() &&
    form.companyContact.trim() &&
    form.billingAddress.trim() &&
    form.pincode.trim() &&
    form.state.trim() &&
    form.city.trim() &&
    (form.gst === "no" || (form.gst === "yes" && form.gstNumber.trim() && form.gstCertificate)) &&
    form.shipments !== "Select"

  const isStep3Valid =
    form.companyType !== "Select Company Type" &&
    form.panCardNo.trim() &&
    form.panCardFile &&
    form.aadhaarNo.trim() &&
    form.aadhaarFront &&
    form.aadhaarBack

  const isStep4Valid =
    form.accountHolder.trim() &&
    form.bankName !== "Select Bank Name" &&
    form.accountType !== "Select Account Type" &&
    form.accountNo.trim() &&
    form.reAccountNo.trim() &&
    form.ifsc.trim() &&
    form.cheque &&
    !accountError

  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid

  const handler = async () => {
    if (!isFormValid) {
      toast.error("Please fill all required fields correctly.")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value as string | Blob)
        }
      })

      await axios.post("/api/user/kyc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("KYC submitted successfully")
      localStorage.removeItem("kyc_draft_v1")
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.info(err.response?.data?.error || "KYC is already pending or approved.")
      } else {
        toast.error("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  const requiredField = <span className="ml-1 font-bold text-red-500">*</span>

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const steps = [
    { id: 0, title: "Personal", icon: User },
    { id: 1, title: "Company", icon: Building2 },
    { id: 2, title: "KYC Details", icon: FileText },
    { id: 3, title: "Banking", icon: CreditCard },
  ]

  const handleNext = () => {
    if (currentStep === 0 && !isStep1Valid) {
      toast.error("Please complete Personal info first.")
      return
    }

    if (currentStep === 1 && !isStep2Valid) {
      toast.error("Please complete Company info first.")
      return
    }

    if (currentStep === 2 && !isStep3Valid) {
      toast.error("Please complete KYC Details first.")
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  if (currentUserKycStatus === "pending") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 pt-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-yellow-100 bg-yellow-50/50 p-12 text-center shadow-sm dark:border-yellow-900/30 dark:bg-yellow-900/10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-500">
            <Clock size={48} strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Verification Pending
            </h1>

            <p className="mx-auto max-w-lg text-lg text-gray-600 dark:text-gray-400">
              Your KYC details have been successfully submitted and are currently under review by our moderation team.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Standard approval time is typically within <strong>24 - 48 Business Hours</strong>. We will notify you via email once your account has been verified.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentUserKycStatus === "approved") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 pt-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-green-100 bg-green-50/50 p-12 text-center shadow-sm dark:border-green-900/30 dark:bg-green-900/10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-lg shadow-green-500/20 dark:bg-green-900/50 dark:text-green-500">
            <CheckCircle2 size={48} strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              KYC Verified
            </h1>

            <p className="mx-auto max-w-md text-lg text-gray-600 dark:text-gray-400">
              Your account is fully verified and ready. You have unrestricted access to all active features on ShipQuickr!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="mb-6 flex items-center space-x-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">KYC Verification</h1>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
            currentUserKycStatus,
          )}`}
        >
          {currentUserKycStatus.charAt(0).toUpperCase() + currentUserKycStatus.slice(1)}
        </span>
      </div>

      {/* Modern Progress Stepper */}
      <div className="relative mx-auto mb-10 flex max-w-4xl justify-between px-4">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 z-0 h-1.5 -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-700 right-0" />

        {/* Animated Active Line */}
        <div
          className="absolute top-1/2 left-0 z-0 h-1.5 -translate-y-1/2 rounded-full bg-purple-600 transition-all duration-500 ease-in-out dark:bg-purple-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex w-24 flex-col items-center">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ${
                currentStep >= idx
                  ? "scale-110 bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "border-2 border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              {currentStep > idx ? <Check size={22} strokeWidth={3} /> : <step.icon size={22} />}
            </div>

            <span
              className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                currentStep >= idx ? "text-purple-700 dark:text-purple-400" : "text-gray-400"
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isUserDataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="animate-in fade-in p-6 shadow-inner duration-300 sm:p-8">
            {/* STEP 1: PERSONAL */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="mb-6 border-b pb-4 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Contact Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Please ensure your core contact details are accurate.
                  </p>
                </div>

                <div className="grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <Input className="bg-gray-50 font-medium focus:ring-purple-500" value={form.firstName} disabled />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <Input className="bg-gray-50 font-medium focus:ring-purple-500" value={form.lastName} disabled />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <Input className="bg-gray-50 font-medium focus:ring-purple-500" value={form.email} disabled />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Mobile No {requiredField}
                    </label>

                    <div className="flex gap-2">
                      <Input
                        className="font-medium focus:ring-purple-500"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        disabled={!isEditingMobile}
                        type="tel"
                        maxLength={10}
                      />

                      {!isEditingMobile ? (
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg border border-purple-200 px-3 font-semibold text-purple-600 transition-colors hover:bg-purple-50"
                          onClick={() => setIsEditingMobile(true)}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg bg-purple-600 px-4 font-semibold text-white transition-colors hover:bg-purple-700"
                          disabled={mobileLoading}
                          onClick={async () => {
                            setMobileLoading(true)
                            try {
                              await axios.post("/api/user/update-mobile", { mobile: form.mobile })
                              toast.success("Mobile updated successfully!")
                              setIsEditingMobile(false)
                            } catch (err) {
                              toast.error("Failed to update mobile")
                            } finally {
                              setMobileLoading(false)
                            }
                          }}
                        >
                          {mobileLoading ? "Saving..." : "Save"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: COMPANY */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="mb-6 border-b pb-4 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Business Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Provide your operational business details and GST configurations if applicable.
                  </p>
                </div>

                <div className="grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Are you having GST ?{" "}
                    </label>

                    <div className="flex gap-4 rounded-lg border bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                      <label className="flex cursor-pointer items-center gap-2 font-medium">
                        <Input
                          type="radio"
                          value="yes"
                          onChange={(e) =>
                            setForm({
                              ...form,
                              gst: e.target.value,
                              gstNumber: "",
                              gstCertificate: null,
                            })
                          }
                          checked={form.gst === "yes"}
                          className="h-4 w-4 text-purple-600"
                        />
                        Yes
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 font-medium">
                        <Input
                          type="radio"
                          value="no"
                          onChange={(e) =>
                            setForm({
                              ...form,
                              gst: e.target.value,
                              gstNumber: "",
                              gstCertificate: null,
                            })
                          }
                          checked={form.gst === "no"}
                          className="h-4 w-4 text-purple-600"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {form.gst === "yes" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          GST Number {requiredField}
                        </label>
                        <Input
                          value={form.gstNumber}
                          onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                          className="uppercase focus:ring-purple-500"
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          GST Certificate {requiredField}
                        </label>

                        <div className="relative">
                          <Input
                            className="sr-only"
                            type="file"
                            id="gst-cert"
                            onChange={(e) => validateAndSetFile(e.target.files?.[0], "gstCertificate")}
                          />

                          <label
                            htmlFor="gst-cert"
                            className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                          >
                            <Upload size={16} className="mr-2 text-gray-500" />
                            <span className="truncate text-sm font-medium text-gray-600">
                              {form.gstCertificate
                                ? form.gstCertificate.name
                                : "Upload File (Max 2MB)"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Monthly Shipments {requiredField}
                    </label>

                    <select
                      value={form.shipments}
                      onChange={(e) => setForm({ ...form, shipments: e.target.value })}
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:ring-purple-500"
                    >
                      <option>Select </option>
                      <option>0 - 50</option>
                      <option>51 - 100</option>
                      <option>101 - 500</option>
                      <option>500 +</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company Name {requiredField}
                    </label>
                    <Input
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company Email {requiredField}
                    </label>
                    <Input
                      type="email"
                      value={form.companyEmail}
                      onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="contact@acme.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company Phone {requiredField}
                    </label>
                    <Input
                      type="tel"
                      value={form.companyContact}
                      onChange={(e) => setForm({ ...form, companyContact: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Billing Address {requiredField}
                    </label>
                    <textarea
                      value={form.billingAddress}
                      onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                      className="h-10 w-full resize-none rounded-lg border bg-white px-4 py-2 text-sm focus:ring-purple-500"
                      placeholder="123 Street Block"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Pincode {requiredField}
                    </label>
                    <Input
                      value={form.pincode}
                      onChange={handlePincodeChange}
                      className="focus:ring-purple-500"
                      placeholder="110001"
                      maxLength={6}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      State {requiredField}
                    </label>
                    <Input value={form.state} readOnly className="bg-gray-50 focus:ring-purple-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      City {requiredField}
                    </label>
                    <Input value={form.city} readOnly className="bg-gray-50 focus:ring-purple-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Website URL
                    </label>
                    <Input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company Logo
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="company-logo"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "companyLogo")}
                      />

                      <label
                        htmlFor="company-logo"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed px-4 py-2 transition-colors hover:bg-gray-50"
                      >
                        <Upload size={16} className="mr-2 text-gray-500" />
                        <span className="truncate text-sm text-gray-600">
                          {form.companyLogo ? form.companyLogo.name : "Upload (Optional)"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Digital Signature
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="company-sig"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "signature")}
                      />

                      <label
                        htmlFor="company-sig"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed px-4 py-2 transition-colors hover:bg-gray-50"
                      >
                        <Upload size={16} className="mr-2 text-gray-500" />
                        <span className="truncate text-sm text-gray-600">
                          {form.signature ? form.signature.name : "Upload (Optional)"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: KYC DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6 border-b pb-4 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Identity Documents
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload verifying identification documents securely. Max file size: 2MB.
                  </p>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-6 rounded-xl border border-gray-100 bg-gray-50/50 p-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Registration Type {requiredField}
                    </label>

                    <select
                      value={form.companyType}
                      onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:ring-purple-500"
                    >
                      <option>Select Company Type </option>
                      <option>Individual</option>
                      <option>Business</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      PAN Card Number {requiredField}
                    </label>
                    <Input
                      value={form.panCardNo}
                      onChange={(e) =>
                        setForm({ ...form, panCardNo: e.target.value.toUpperCase() })
                      }
                      className="uppercase focus:ring-purple-500"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      PAN Card Image {requiredField}
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="pan-img"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "panCardFile")}
                      />

                      <label
                        htmlFor="pan-img"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-purple-50"
                      >
                        <Upload size={16} className="mr-2 text-purple-600" />
                        <span className="truncate text-sm font-medium text-gray-600">
                          {form.panCardFile ? form.panCardFile.name : "Upload PAN (Max 2MB)"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="hidden sm:block" />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Aadhar Card Number {requiredField}
                    </label>
                    <Input
                      value={form.aadhaarNo}
                      onChange={(e) => setForm({ ...form, aadhaarNo: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="1234 5678 9012"
                      maxLength={12}
                    />
                  </div>

                  <div className="space-y-1.5" />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Aadhar Front Image {requiredField}
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="aadhar-f"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "aadhaarFront")}
                      />

                      <label
                        htmlFor="aadhar-f"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-purple-50"
                      >
                        <Upload size={16} className="mr-2 text-purple-600" />
                        <span className="truncate text-sm font-medium text-gray-600">
                          {form.aadhaarFront ? form.aadhaarFront.name : "Upload Front (Max 2MB)"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Aadhar Back Image {requiredField}
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="aadhar-b"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "aadhaarBack")}
                      />

                      <label
                        htmlFor="aadhar-b"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-purple-50"
                      >
                        <Upload size={16} className="mr-2 text-purple-600" />
                        <span className="truncate text-sm font-medium text-gray-600">
                          {form.aadhaarBack ? form.aadhaarBack.name : "Upload Back (Max 2MB)"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: BANK DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-6 border-b pb-4 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Financial Setup
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure your receiving bank account and attach a verification cheque.
                  </p>
                </div>

                <div className="grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Account Holder Name {requiredField}
                    </label>
                    <Input
                      value={form.accountHolder}
                      onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                      className="focus:ring-purple-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Bank Name {requiredField}
                    </label>

                    <select
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:ring-purple-500"
                    >
                      <option>Select Bank Name </option>
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Account Type {requiredField}
                    </label>

                    <select
                      value={form.accountType}
                      onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                      className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:ring-purple-500"
                    >
                      <option>Select Account Type </option>
                      <option>Savings</option>
                      <option>Current</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      IFSC Code {requiredField}
                    </label>
                    <Input
                      value={form.ifsc}
                      onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                      className="uppercase focus:ring-purple-500"
                      placeholder="SBIN0001234"
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Account Number {requiredField}
                    </label>
                    <Input
                      type="password"
                      value={form.accountNo}
                      onChange={(e) => {
                        setForm({ ...form, accountNo: e.target.value })
                        if (form.reAccountNo && e.target.value !== form.reAccountNo) {
                          setAccountError("Account numbers do not match")
                        } else {
                          setAccountError("")
                        }
                      }}
                      className="focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Re - Enter Account Number {requiredField}
                    </label>
                    <Input
                      value={form.reAccountNo}
                      onChange={(e) => {
                        setForm({ ...form, reAccountNo: e.target.value })
                        if (form.accountNo && e.target.value !== form.accountNo) {
                          setAccountError("Account numbers do not match")
                        } else {
                          setAccountError("")
                        }
                      }}
                      className={`focus:ring-purple-500 ${
                        accountError ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {accountError && <p className="text-xs font-medium text-red-500">{accountError}</p>}
                  </div>

                  <div className="mt-3 space-y-1.5 sm:col-span-2 max-w-sm">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Cancelled Cheque Photo {requiredField}
                    </label>

                    <div className="relative">
                      <Input
                        className="sr-only"
                        type="file"
                        id="bank-cheque"
                        onChange={(e) => validateAndSetFile(e.target.files?.[0], "cheque")}
                      />

                      <label
                        htmlFor="bank-cheque"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <Upload size={18} className="mr-2 text-indigo-500" />
                        <span className="truncate text-sm font-semibold text-gray-700">
                          {form.cheque ? form.cheque.name : "Upload Cheque (Max 2MB)"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Footer */}
      {!isUserDataLoading && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-bold transition-all ${
              currentStep === 0
                ? "cursor-not-allowed bg-transparent text-gray-300"
                : "cursor-pointer bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-6 py-2.5 font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] hover:bg-purple-700"
            >
              Next Step
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handler}
              disabled={loading || !isFormValid}
              className={`flex items-center gap-2 rounded-xl px-8 py-2.5 font-bold transition-all ${
                loading || !isFormValid
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "cursor-pointer bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] hover:bg-emerald-700"
              }`}
            >
              {loading ? (
                <ButtonLoading name="Submitting..." />
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />
                  Submit KYC
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}