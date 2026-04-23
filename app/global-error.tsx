"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkLoadError =
      error.name === "ChunkLoadError" ||
      error.message?.toLowerCase().includes("chunk load") ||
      error.message
        ?.toLowerCase()
        .includes("failed to fetch dynamically imported module");

    if (isChunkLoadError) {
      window.location.reload();
    } else {
      console.error("Global Error Boundary caught:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "2rem",
            textAlign: "center",
            borderRadius: "1rem",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            {"⚠️"}
          </div>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "0.75rem",
            }}
          >
            Something Went Wrong
          </h2>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            The application encountered an unexpected error. Please try
            refreshing the page.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              width: "100%",
              padding: "0.75rem 1.5rem",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh Now
          </button>
        </div>
      </body>
    </html>
  );
}