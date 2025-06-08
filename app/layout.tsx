import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | ShipQuickr',
    default: 'ShipQuickr - Fast & Reliable Shipping Solutions'
  },
  description: 'ShipQuickr provides efficient shipping and logistics solutions for businesses with real-time tracking, competitive rates, and seamless integration.',
  keywords: ['shipping', 'logistics', 'courier services', 'ecommerce shipping'],
  robots: 'index, follow',
  openGraph: {
    title: 'ShipQuickr',
    description: 'Fast & Reliable Shipping Solutions',
    url: 'https://shipquickr.com',
    siteName: 'ShipQuickr',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipQuickr',
    description: 'Fast & Reliable Shipping Solutions',
    images: ['/twitter-image.jpg'],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastContainer position="top-right" autoClose={3000} />

      </body>
    </html>
  );
}
