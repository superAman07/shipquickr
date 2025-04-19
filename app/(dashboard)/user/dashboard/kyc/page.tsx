"use client"
import { useState } from "react"
import { Check, Upload, Building2, User, CreditCard, FileText, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function KYC() {
  const [form, setForm] = useState({
    // Add all fields here as per your UI
    kycType: "",
    panCardNo: "",
    panCardFile: null,
    aadhaarNo: "",
    aadhaarFront: null,
    aadhaarBack: null,
    accountHolder: "",
    bankName: "",
    accountType: "",
    accountNo: "",
    reAccountNo: "",
    ifsc: "",
    cheque: null,
    gst: "yes",
    gstNumber: "",
    gstCertificate: null,
    shipments: "",
    companyName: "",
    companyEmail: "",
    companyContact: "",
    billingAddress: "",
    pincode: "",
    state: "",
    city: "",
    website: "",
    signature: null,
    companyLogo: null,
  })

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Section Header */}
      <div className="flex items-center space-x-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">KYC Verification</h1>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
          Pending
        </span>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2">
            <User size={20} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Personal</span>
        </div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2">
            <Building2 size={20} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Company</span>
        </div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2">
            <FileText size={20} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">KYC</span>
        </div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2">
            <CreditCard size={20} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Bank</span>
        </div>
      </div>

      {/* Personal Information */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              <span className="text-sm font-bold">1</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Personal Information</h2>
          </div>
          <div className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs flex items-center gap-1">
            <Check size={14} />
            <span>Completed</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="Aman"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="vishwakarma"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email ID</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="amanvishwa2806@gmail.com"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile No</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="8562978889"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* Company Information */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              <span className="text-sm font-bold">2</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Company Information</h2>
          </div>
          <div className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs flex items-center gap-1">
            <span>In Progress</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Are you having GST?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Input
                    type="radio"
                    name="gst"
                    value="yes"
                    defaultChecked
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Input
                    type="radio"
                    name="gst"
                    value="no"
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GST Number</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload GST Certificate
              </label>
              <div className="relative">
                <Input type="file" className="sr-only" id="gst-certificate" />
                <label
                  htmlFor="gst-certificate"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Certificate</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number Of Shipments</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
                title="Select an option"
              >
                <option>Select</option>
                <option>0-50</option>
                <option>51-100</option>
                <option>101-500</option>
                <option>500+</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Email Id</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter company email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Contact No</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter contact number"
                type="tel"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billing Address</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                rows={2}
                placeholder="Enter billing address"
              ></textarea>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter pincode"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter state"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website Url</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter website URL"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Signature</label>
              <div className="relative">
                <Input type="file" className="sr-only" id="signature" />
                <label
                  htmlFor="signature"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Signature</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Company Logo</label>
              <div className="relative">
                <Input type="file" className="sr-only" id="company-logo" />
                <label
                  htmlFor="company-logo"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Logo</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KYC Details */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              <span className="text-sm font-bold">3</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">KYC Details</h2>
          </div>
          <div className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs flex items-center gap-1">
            <span>In Progress</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">KYC Type</label>
              <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
              <select
                id="bank-name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
              >
                <option>Select KYC Type</option>
                <option>Individual</option>
                <option>Business</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pan Card No.</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter PAN card number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ID Proof - Upload Pan Card
              </label>
              <div className="relative">
                <Input type="file" className="sr-only" id="pan-card" />
                <label
                  htmlFor="pan-card"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload PAN Card</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Proof</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="Aadhar Card"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter Aadhaar No.</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter Aadhaar number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Aadhaar Card Front Side
              </label>
              <div className="relative">
                <Input type="file" className="sr-only" id="aadhaar-front" />
                <label
                  htmlFor="aadhaar-front"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Front Side</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Aadhaar Card Back Side
              </label>
              <div className="relative">
                <Input type="file" className="sr-only" id="aadhaar-back" />
                <label
                  htmlFor="aadhaar-back"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Back Side</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bank Information */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              <span className="text-sm font-bold">4</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Bank Information</h2>
          </div>
          <div className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs flex items-center gap-1">
            <span>In Progress</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Holder Name</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter account holder name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
                title="Select Bank Name"
              >
                <option>Select Bank Name</option>
                <option>State Bank of India</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
              <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
              <select
                id="account-type"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
              >
                <option>Select Account Type</option>
                <option>Savings</option>
                <option>Current</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account No.</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Re-Enter Account No</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Re-enter account number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IFSC Code</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter IFSC code"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Cancelled Cheque
              </label>
              <div className="relative">
                <Input type="file" className="sr-only" id="cancelled-cheque" />
                <label
                  htmlFor="cancelled-cheque"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    <span>Upload Cheque</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          type="button"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          Submit KYC
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
