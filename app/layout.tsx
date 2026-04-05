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
      <body className="overflow-x-hidden">
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
