import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer position="top-right" autoClose={3000} />

      </body>
    </html>
  );
}
