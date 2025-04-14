"use client";

import LoadingBar from "@/components/loadingBar"; // Thin progress bar
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600">
      <div className="min-h-screen">{children}</div>
    </div>
  );
}