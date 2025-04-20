"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingBar from "./loadingBar";

export default function RouteLoadingBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 700); // adjust duration as needed
    return () => clearTimeout(timeout);
  }, [pathname]);

  return loading ? <LoadingBar /> : null;
}