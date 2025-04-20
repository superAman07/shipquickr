"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

export default function KycDetailsPage() {
  const { userId } = useParams();
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/admin/kyc/${userId}`)
      .then(res => setKyc(res.data.kyc))
      .catch(() => setKyc(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!kyc) return <div className="p-8 text-center text-red-500">KYC details not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">KYC Details for {kyc.user.firstName} {kyc.user.lastName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Personal Info</h2>
          <p><b>Name:</b> {kyc.user.firstName} {kyc.user.lastName}</p>
          <p><b>Email:</b> {kyc.user.email}</p>
          <p><b>Mobile:</b> {kyc.mobile}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Company Info</h2>
          <p><b>Company Name:</b> {kyc.companyName}</p>
          <p><b>GST:</b> {kyc.gst ? "Yes" : "No"}</p>
          <p><b>GST Number:</b> {kyc.gstNumber}</p>
          <p><b>Shipments:</b> {kyc.shipments}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">KYC Documents</h2>
          <p>
            <b>PAN No:</b> {kyc.panCardNo}<br />
            <b>PAN File:</b> {kyc.panCardUrl && <a href={kyc.panCardUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
          <p>
            <b>Aadhaar No:</b> {kyc.aadhaarNo}<br />
            <b>Aadhaar Front:</b> {kyc.aadhaarFrontUrl && <a href={kyc.aadhaarFrontUrl} target="_blank" className="text-blue-600 underline">View</a>}<br />
            <b>Aadhaar Back:</b> {kyc.aadhaarBackUrl && <a href={kyc.aadhaarBackUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
          <p>
            <b>GST Certificate:</b> {kyc.gstCertificateUrl && <a href={kyc.gstCertificateUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
          <p>
            <b>Signature:</b> {kyc.signatureUrl && <a href={kyc.signatureUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
          <p>
            <b>Company Logo:</b> {kyc.companyLogoUrl && <a href={kyc.companyLogoUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
          <p>
            <b>Cancelled Cheque:</b> {kyc.chequeUrl && <a href={kyc.chequeUrl} target="_blank" className="text-blue-600 underline">View</a>}
          </p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Bank Info</h2>
          <p><b>Account Holder:</b> {kyc.accountHolder}</p>
          <p><b>Bank Name:</b> {kyc.bankName}</p>
          <p><b>Account Type:</b> {kyc.accountType}</p>
          <p><b>Account No:</b> {kyc.accountNo}</p>
          <p><b>IFSC:</b> {kyc.ifsc}</p>
        </div>
      </div>
    </div>
  );
}