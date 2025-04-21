import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "./loading";

type KycStatus = "loading" | "approved" | "pending" | "rejected" | "none";

export default function KycGuard({ children }: { children: React.ReactNode }) {
  const [kycStatus, setKycStatus] = useState<KycStatus>("loading");

  useEffect(() => {
    axios.get("/api/user/kyc")
      .then(res => {
        setKycStatus(res.data.kycStatus || "none");
        if (res.data.kycStatus !== "approved") {
          toast.info("KYC not verified. Please complete your KYC to use order and warehouse features.");
        }
      })
      .catch(() => {
        setKycStatus("none");
        toast.error("Unable to fetch KYC status.");
      });
  }, []);

  if (kycStatus === "loading") return <div><Loading/></div>;

  if (kycStatus !== "approved") {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded shadow text-center">
        <div className="text-lg font-semibold mb-2">KYC Not Verified</div>
        <div className="mb-4">Please complete and verify your KYC to use warehouse and order features.</div>
        <a href="/user/dashboard/kyc" className="text-indigo-700 underline">Go to KYC Page</a>
      </div>
    );
  }

  return <>{children}</>;
}