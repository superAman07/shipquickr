"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SelectedDoc = {
  url: string;
  title: string;
} | null;

export default function KycDetailsPage() {
  const { userId } = useParams();
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SelectedDoc>(null);

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`/api/admin/kyc/${userId}`)
      .then((res) => setKyc(res.data.kyc))
      .catch(() => setKyc(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleView = (url: string, title: string) => {
    setSelectedDoc({ url, title });
  };

  const getFileType = (url: string) => {
    const cleanUrl = url.split("?")[0].toLowerCase();

    if (cleanUrl.endsWith(".pdf")) return "pdf";
    return "image";
  };

  const DocView = ({
    label,
    value,
    url,
    title,
  }: {
    label: string;
    value: string;
    url?: string;
    title: string;
  }) => (
    <p>
      <b>{label}</b> {value}
      <br />
      {url && (
        <>
          <b>{title} File: </b>{" "}
          <button
            type="button"
            onClick={() => handleView(url, title)}
            className="text-blue-600 underline hover:text-blue-800 transition-colors"
          >
            View
          </button>
        </>
      )}
    </p>
  );

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!kyc) {
    return (
      <div className="p-8 text-center text-red-500">
        KYC details not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        KYC Details for {kyc.user?.firstName} {kyc.user?.lastName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Personal Info</h2>
          <p>
            <b>Name: </b> {kyc.user?.firstName} {kyc.user?.lastName}
          </p>
          <p>
            <b>Email: </b> {kyc.user?.email}
          </p>
          <p>
            <b>Mobile: </b> {kyc.mobile}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Company Info</h2>
          <p>
            <b>Company Name: </b> {kyc.companyName}
          </p>
          <p>
            <b>GST: </b> {kyc.gst ? "Yes" : "No"}
          </p>
          <p>
            <b>GST Number: </b> {kyc.gstNumber}
          </p>
          <p>
            <b>Shipments: </b> {kyc.shipments}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">KYC Documents</h2>
          <div className="space-y-3">
            <DocView
              label="PAN No:"
              value={kyc.panCardNo}
              url={kyc.panCardUrl}
              title="PAN Card"
            />

            <p>
              <b>Aadhaar No: </b> {kyc.aadhaarNo}
              <br />
              {kyc.aadhaarFrontUrl && (
                <>
                  <b>Aadhaar Front: </b>{" "}
                  <button
                    type="button"
                    onClick={() =>
                      handleView(kyc.aadhaarFrontUrl, "Aadhaar Front")
                    }
                    className="text-blue-600 underline"
                  >
                    View
                  </button>
                  <br />
                </>
              )}

              {kyc.aadhaarBackUrl && (
                <>
                  <b>Aadhaar Back: </b>{" "}
                  <button
                    type="button"
                    onClick={() =>
                      handleView(kyc.aadhaarBackUrl, "Aadhaar Back")
                    }
                    className="text-blue-600 underline"
                  >
                    View
                  </button>
                </>
              )}
            </p>

            <DocView
              label=""
              value=""
              url={kyc.gstCertificateUrl}
              title="GST Certificate"
            />
            <DocView label="" value="" url={kyc.signatureUrl} title="Signature" />
            <DocView
              label=""
              value=""
              url={kyc.companyLogoUrl}
              title="Company Logo"
            />
            <DocView
              label=""
              value=""
              url={kyc.chequeUrl}
              title="Cancelled Cheque"
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Bank Info</h2>
          <p>
            <b>Account Holder: </b> {kyc.accountHolder}
          </p>
          <p>
            <b>Bank Name: </b> {kyc.bankName}
          </p>
          <p>
            <b>Account Type: </b> {kyc.accountType}
          </p>
          <p>
            <b>Account No: </b> {kyc.accountNo}
          </p>
          <p>
            <b>IFSC: </b> {kyc.ifsc}
          </p>
        </div>
      </div>

      <Dialog
        open={!!selectedDoc}
        onOpenChange={(open) => !open && setSelectedDoc(null)}
      >
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader className="px-6 py-4 border-b dark:border-gray-800 flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl">
              {selectedDoc?.title}
            </DialogTitle>

            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center p-4">
            {selectedDoc &&
              (getFileType(selectedDoc.url) === "pdf" ? (
                <iframe
                  src={selectedDoc.url}
                  className="w-full h-full rounded-md bg-white border shadow-sm"
                  title={selectedDoc.title}
                />
              ) : (
                <img
                  src={selectedDoc.url}
                  alt={selectedDoc.title}
                  className="max-w-full max-h-full object-contain rounded-md drop-shadow-md"
                />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}