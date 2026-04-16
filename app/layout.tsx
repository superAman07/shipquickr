import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export const metadata: Metadata = {
  title: "ShipQuickr - Seamless Shipping Solutions",
  description: "ShipQuickr is your reliable partner for logistics and e-commerce shipping solutions across India.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ShipQuickr",
    description: "Seamless Shipping Solutions for E-commerce.",
    url: "https://shipquickr.com",
    siteName: "ShipQuickr",
    images: [
      {
        url: "/og-image.png", // If you have an OpenGraph image for link previews, put it in the public folder
        width: 1200,
        height: 630,
        alt: "ShipQuickr Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                var errorMsg = event.message || (event.error && event.error.message) || '';
                var errorName = (event.error && event.error.name) || '';
                if (errorName === 'ChunkLoadError' || errorMsg.includes('ChunkLoadError') || errorMsg.includes('Loading chunk') || errorMsg.includes('dynamically imported module')) {
                  var isReloading = sessionStorage.getItem('chunk_reload');
                  if (!isReloading) {
                    sessionStorage.setItem('chunk_reload', 'true');
                    setTimeout(function() { sessionStorage.removeItem('chunk_reload'); }, 10000);
                    window.location.reload();
                  }
                }
              }, true);
              window.addEventListener('unhandledrejection', function(event) {
                var errorMsg = (event.reason && event.reason.message) || '';
                var errorName = (event.reason && event.reason.name) || '';
                if (errorName === 'ChunkLoadError' || errorMsg.includes('ChunkLoadError') || errorMsg.includes('Loading chunk') || errorMsg.includes('dynamically imported module')) {
                  var isReloading = sessionStorage.getItem('chunk_reload');
                  if (!isReloading) {
                    sessionStorage.setItem('chunk_reload', 'true');
                    setTimeout(function() { sessionStorage.removeItem('chunk_reload'); }, 10000);
                    window.location.reload();
                  }
                }
              }, true);
            `
          }}
        />
      </head>
      <body className="overflow-x-hidden">
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
