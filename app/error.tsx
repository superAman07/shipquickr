"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detect ChunkLoadError which happens when new code is deployed to Hostinger
    // while a user actively has the app open in their browser.
    const isChunkLoadError =
      error.name === "ChunkLoadError" ||
      error.message?.toLowerCase().includes("chunk load") ||
      error.message
        ?.toLowerCase()
        .includes("failed to fetch dynamically imported module");

    if (isChunkLoadError) {
      // Force a hard reload to fetch the new code bundles from the server
      window.location.reload();
    } else {
      // Log other unexpected errors
      console.error("App Error Boundary caught:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 px-4 dark:bg-[#10162A]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>

        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          Application Update
        </h2>

        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          We just pushed a new update. The application needs to refresh to load
          the latest features.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
        >
          <RefreshCcw className="h-5 w-5" />
          Refresh Now
        </button>
      </div>
    </div>
  );
}