"use client"
import { useEffect, useState } from "react"
import { Check, Upload, Building2, User, CreditCard, FileText, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { toast } from "react-toastify"
import ButtonLoading from "@/components/buttonLoading"
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode"

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export default function KYC() { 
   
  const [accountError, setAccountError] = useState("");
  const [form, setForm] = useState({ 
    firstName: "Loading...",
    lastName: "Loading...",
    email: "Loading...",
    mobile: "",
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

  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  useEffect(() => {
    const fetchUserData = async () => {
      setIsUserDataLoading(true);  
      try {
        const response = await axios.get<UserDetails>('/api/user/me');
        const userData = response.data; 
        setForm(prevForm => ({
          ...prevForm,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
        }));
      } catch (error) {
        console.error("Failed to fetch user data:", error); 
        if (axios.isAxiosError(error) && error.response?.status === 401) {
           toast.error("Session expired or invalid. Please log in again."); 
        } else {
           toast.error("Could not load user details. Please refresh.");
        } 
         setForm(prevForm => ({
          ...prevForm,
          firstName: "",
          lastName: "",
          email: "",
        }));
      } finally {
        setIsUserDataLoading(false); 
      }
    };

    fetchUserData();
  }, []);



  function isFormValid() {
    if (isUserDataLoading) return false;
    return (
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.mobile.trim() &&
      form.companyType !== "Select Company Type" &&
      form.panCardNo.trim() &&
      form.panCardFile &&
      form.aadhaarNo.trim() &&
      form.aadhaarFront &&
      form.aadhaarBack &&
      form.accountHolder.trim() &&
      form.bankName !== "Select Bank Name" &&
      form.accountType !== "Select Account Type" &&
      form.accountNo.trim() &&
      form.reAccountNo.trim() &&
      form.ifsc.trim() &&
      form.cheque &&
      // form.gstNumber.trim() &&
      (form.gst === "no" || (form.gst === "yes" && form.gstNumber.trim() && form.gstCertificate)) &&
      form.gstCertificate &&
      form.shipments !== "Select" &&
      form.companyName.trim() &&
      form.companyEmail.trim() &&
      form.companyContact.trim() &&
      form.billingAddress.trim() &&
      form.pincode.trim() &&
      form.state.trim() &&
      form.city.trim()
    );
  }

  const [loading, setLoading] = useState(false)

  const handler = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      const response = await axios.post("/api/user/kyc", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("KYC submitted successfully");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.info("KYC already uploaded. Verification pending by admin.");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };
 
  const requiredField = <span className="text-red-500 ml-1">*</span>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6"> 
      <div className="flex items-center space-x-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">KYC Verification</h1>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
          Pending
        </span>
      </div>
 
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
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
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
                value={form.firstName}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value={form.lastName}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email ID</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value={form.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile No {requiredField}</label>
              <Input
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>
 
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
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
                    onChange={(e) => setForm({ ...form, gst: e.target.value, gstNumber: "", gstCertificate: null })} 
                    checked={form.gst === "yes"} 
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Input 
                    type="radio"
                    name="gst"
                    value="no"
                    onChange={(e) => setForm({ ...form, gst: e.target.value, gstNumber: "", gstCertificate: null })} 
                    checked={form.gst === "no"}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
            </div>
            {form.gst === "yes" && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    GST Number{requiredField}
                  </label>
                  <Input
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    required={form.gst === "yes"}  
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter GST number"
                  />
                </div>
                <div className="space-y-2">
                  <label  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload GST Certificate{requiredField}
                  </label>
                  <div className="relative">
                    <Input 
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e=>{
                          const file = e.target.files?.[0];
                          if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                            toast.error("Only images or PDF allowed!");
                            return;
                          }
                          setForm({...form,gstCertificate:e.target.files?.[0]||null})
                        }
                      } 
                      required={form.gst === "yes"}  
                      className="sr-only" id="gst-certificate" 
                    />
                    <label
                      htmlFor="gst-certificate"
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Upload size={18} />
                        {form.gstCertificate ? form.gstCertificate.name : "Upload Certificate"}
                      </div>
                    </label>
                    {form.gstCertificate && (
                      <p className="text-xs text-green-600 mt-1 truncate">{form.gstCertificate.name}</p>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number Of Shipments {requiredField}</label>
              <select
                value={form.shipments}
                onChange={(e) => setForm({ ...form, shipments: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Name{requiredField}
              </label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Email Id{requiredField}
              </label>
              <Input
                value={form.companyEmail}
                onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter company email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Contact No{requiredField}
              </label>
              <Input
                value={form.companyContact}
                onChange={(e) => setForm({ ...form, companyContact: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter contact number"
                type="tel"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billing Address {requiredField}</label>
              <textarea
                value={form.billingAddress}
                onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                rows={2}
                placeholder="Enter billing address"
              ></textarea>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pincode{requiredField}
              </label>
              <Input 
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter pincode"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State{requiredField}</label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter state"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City{requiredField}</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website Url 
              </label>
              <Input
                value={form.website} 
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter website URL"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Signature 
              </label>
              <div className="relative">
                <Input 
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                      setForm({...form,signature:e.target.files?.[0]|| null})
                    }}   
                  type="file"  className="sr-only" id="signature" 
                />
                <label
                  htmlFor="signature"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.signature ? form.signature.name : "Upload Signature"}
                  </div>
                </label>
                {form.signature && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.signature.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Company Logo 
              </label>
              <div className="relative">
                <Input 
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                    setForm({...form,companyLogo:(e.target as HTMLInputElement).files?.[0]||null})}}
                  type="file" className="sr-only" id="company-logo"
                />
                <label
                  htmlFor="company-logo"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.companyLogo ? form.companyLogo.name : "Upload Company Logo"}
                  </div>
                </label>
                {form.companyLogo && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.companyLogo.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KYC Details */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
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
              <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Type {requiredField}</label>
              <select
                value={form.companyType}
                onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                id="bank-name"
                className="w-full px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
              >
                <option>Select Company Type</option>
                <option>Individual</option>
                <option>Business</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pan Card No.{requiredField}
              </label>
              <Input
                value={form.panCardNo}
                onChange={(e) => setForm({ ...form, panCardNo: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter PAN card number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ID Proof - Upload Pan Card{requiredField}
              </label>
              <div className="relative">
                <Input 
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                    setForm({...form,panCardFile:(e.target as HTMLInputElement).files?.[0]||null})}}
                  required type="file" className="sr-only" id="pan-card"
                />
                <label
                  htmlFor="pan-card"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.panCardFile ? form.panCardFile.name : "Upload Pan Card"}
                  </div>
                </label>
                {form.panCardFile && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.panCardFile.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Proof</label>
              <Input
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                value="Aadhar Card"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter Aadhaar No.{requiredField}
              </label>
              <Input
                value={form.aadhaarNo}
                onChange={(e) => setForm({ ...form, aadhaarNo: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter Aadhaar number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Aadhaar Card Front Side{requiredField}
              </label>
              <div className="relative">
                <Input
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                    setForm({...form,aadhaarFront:(e.target as HTMLInputElement).files?.[0]||null})}}
                  required type="file" className="sr-only" id="aadhaar-front" 
                />
                <label
                  htmlFor="aadhaar-front"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.aadhaarFront ? form.aadhaarFront.name : "Upload Front Side"}
                  </div>
                </label>
                {form.aadhaarFront && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.aadhaarFront.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Aadhaar Card Back Side{requiredField}
              </label>
              <div className="relative">
                <Input  
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                    setForm({...form,aadhaarBack:(e.target as HTMLInputElement).files?.[0]||null})
                  }}
                  required type="file" className="sr-only" id="aadhaar-back" 
                />
                <label
                  htmlFor="aadhaar-back"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.aadhaarBack ? form.aadhaarBack.name : "Upload Back Side"}
                  </div>
                </label>
                {form.aadhaarBack && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.aadhaarBack.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bank Information */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Holder Name{requiredField}
              </label>
              <Input
                value={form.accountHolder}
                onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter account holder name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name {requiredField}</label>
              <select
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
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
              <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                id="account-type"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none custom-select"
              >
                <option>Select Account Type</option>
                <option>Savings</option>
                <option>Current</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account No.{requiredField}
              </label>
              <Input
                value={form.accountNo}
                required
                onChange={e => {
                  setForm({ ...form, accountNo: e.target.value });
                  if (form.reAccountNo && e.target.value !== form.reAccountNo) {
                    setAccountError("Account numbers do not match");
                  } else {
                    setAccountError("");
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Re-Enter Account No{requiredField}
              </label>
              <Input
                value={form.reAccountNo}
                required
                onChange={e => {
                  setForm({ ...form, reAccountNo: e.target.value });
                  if (form.accountNo && e.target.value !== form.accountNo) {
                    setAccountError("Account numbers do not match");
                  } else {
                    setAccountError("");
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Re-enter account number"
              />
              {accountError && (
                <p className="text-red-500 text-xs mt-1">{accountError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IFSC Code{requiredField}
              </label>
              <Input
                value={form.ifsc}
                onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Enter IFSC code"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Cancelled Cheque{requiredField}
              </label>
              <div className="relative">
                <Input 
                  accept="image/*,application/pdf"
                  onChange={e=>{
                      const file = e.target.files?.[0]
                      if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
                        toast.error("Only images or PDF allowed!");
                        return;
                      }
                    setForm({...form,cheque:(e.target as HTMLInputElement).files?.[0]||null})}}
                  required type="file" className="sr-only" id="cancelled-cheque"
                />
                <label
                  htmlFor="cancelled-cheque"
                  className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Upload size={18} />
                    {form.cheque ? form.cheque.name : "Upload Cancelled Cheque"}
                  </div>
                </label>
                {form.cheque && (
                  <p className="text-xs text-green-600 mt-1 truncate">{form.cheque.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
      <button
        onClick={handler}
        type="button"
        disabled={isUserDataLoading || loading || !!accountError || !isFormValid()}
        className={`px-6 cursor-pointer py-3 ${loading || !!accountError || !isFormValid()
          ? "bg-gray-400 cursor-not-allowed text-gray-200"
          : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"}   text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2`}
      >
        {loading ? (
          <ButtonLoading name="Submitting..." />
        ) : (
          <>
            Submit KYC
            <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
    </div>
  )
}
