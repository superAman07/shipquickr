"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Wallet,
  ChevronDown,
  User,
  LogOut,
  BadgePlusIcon as BatteryPlus,
  Settings,
  Search,
  Lock,
} from "lucide-react";
import LogoutButton from "./logout";
import Link from "next/link";
import {
  useWallet as useActualWallet,
  type WalletContextType,
} from "@/contexts/WalletContext";
import RechargeModal from "./recharge-model";

const useConditionalWallet = (userRole: string): WalletContextType => {
  if (userRole !== "admin") {
    return useActualWallet();
  }

  return {
    balance: null,
    isLoadingBalance: false,
    refreshBalance: async () => {},
  };
};

interface NavbarProps {
  userRole: string;
  userName: string;
  userId?: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpenAction: (open: boolean) => void;
}

export default function Navbar({
  userRole,
  userName,
  userId,
  mobileMenuOpen,
  setMobileMenuOpenAction,
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const calculatedCustomerId = userId ? 150000 + Number(userId) : null;

  const { balance, isLoadingBalance } = useConditionalWallet(userRole);

  const getInitials = (name: string) => {
    if (!name) return "";

    const names = name.split(" ");
    const firstName = names[0] || "";
    const lastName = names.length > 1 ? names[names.length - 1] : "";

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(e.target as Node) &&
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRechargeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRechargeModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  /* ── Shared dropdown menu items ── */
  const renderDropdownMenu = (onClose: () => void) => (
    <>
      {/* Header with avatar + customer ID */}
      <div className="flex items-center gap-3 bg-[#0a0c37] p-5 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
          {getInitials(userName)}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="mb-1 truncate text-[15px] font-bold leading-tight text-white">
            {userName}
          </span>

          {userRole !== "admin" && (
            <div className="flex flex-col gap-0.5 text-[11px] leading-none text-slate-300">
              <span>Customer Id</span>
              <strong className="text-[13px] font-semibold tracking-wide text-white">
                {calculatedCustomerId || "N/A"}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-0.5 p-2">
        <Link
          href={`/${userRole}/dashboard/profile`}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={onClose}
        >
          <User className="h-4 w-4 text-slate-400" />
          My Profile
        </Link>

        {userRole !== "admin" && (
          <Link
            href={`/${userRole}/dashboard/wallet`}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <Wallet className="h-4 w-4 text-slate-400" />
            Wallet
          </Link>
        )}

        {userRole !== "admin" && (
          <button
            onClick={(e) => {
              handleRechargeClick(e);
              onClose();
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          >
            <BatteryPlus className="h-4 w-4" />
            Recharge Wallet
          </button>
        )}

        {userRole !== "admin" && (
          <Link
            href={`/${userRole}/dashboard/settings`}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <Lock className="h-4 w-4 text-slate-400" />
            API Integration
          </Link>
        )}

        <div className="my-1 mx-2 h-px bg-slate-100 dark:bg-gray-700" />

        <div
          className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={onClose}
        >
          <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover:text-rose-500" />
          <LogoutButton
            propUser={userRole}
            propStyle={{
              color:
                "text-slate-700 dark:text-gray-200 group-hover:text-rose-600 transition-colors",
            }}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-8xl px-0 sm:px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* ── Logo (Desktop) ── */}
            <div className="hidden items-center md:flex">
              <Link href={`/${userRole}/dashboard`} className="flex items-center">
                <img
                  src="/shipquickr.png"
                  alt="Logo"
                  className="h-[57px] w-[145px]"
                />
              </Link>
            </div>

            {/* ── Desktop Search Bar ── */}
            <div className="hidden max-w-3xl flex-1 items-center px-8 lg:px-16 md:flex">
              <div className="group relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                </span>

                <input
                  type="text"
                  placeholder="Search AWB or Customer Name..."
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-[14px] font-medium text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 hover:bg-gray-50/80 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            {/* ── Desktop Right Section ── */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Wallet + Recharge */}
              {userRole !== "admin" && (
                <div
                  onClick={handleRechargeClick}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200/50 bg-gray-100 p-1 pl-3 shadow-sm transition-all duration-200 hover:bg-gray-200 hover:shadow-md dark:border-gray-700/50 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[14px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {isLoadingBalance
                        ? "Loading..."
                        : `₹${balance !== null ? balance.toFixed(2) : "0.00"}`}
                    </span>
                  </div>

                  <div className="ml-2 flex items-center justify-center rounded-lg bg-[#0a0c37] p-2 text-white shadow-sm transition hover:bg-[#1a1c57] active:scale-95">
                    <BatteryPlus className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Profile Trigger + Dropdown */}
              <div
                className="relative ml-1 cursor-pointer"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                {/* Trigger */}
                <div className="flex cursor-pointer items-center gap-2 rounded-xl p-2 pl-2.5 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0c37] text-sm font-semibold text-gray-200 shadow-sm dark:bg-gray-700 dark:text-gray-200">
                    {getInitials(userName)}
                  </div>
                  <span className="cursor-pointer text-[14px] font-semibold text-gray-700 dark:text-gray-300">
                    {userName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>

                {/* Hover Bridge — pointer-events-none when closed prevents ghost triggers */}
                <div
                  className={`absolute top-full right-0 z-50 pt-2 ${
                    isProfileOpen ? "" : "pointer-events-none"
                  }`}
                >
                  <div
                    ref={desktopDropdownRef}
                    className={`relative w-64 overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-out origin-top-right dark:border-gray-700 dark:bg-gray-800 ${
                      isProfileOpen
                        ? "translate-y-0 scale-100 opacity-100 visible"
                        : "-translate-y-2 scale-95 pointer-events-none opacity-0 invisible"
                    }`}
                  >
                    {renderDropdownMenu(() => setIsProfileOpen(false))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile Layout ── */}
            <div className="flex w-full items-center justify-between md:hidden">
              {/* Hamburger + Logo */}
              <div className="flex items-center">
                {userRole !== "admin" && (
                  <button
                    type="button"
                    className="mr-2 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpenAction(!mobileMenuOpen)}
                    aria-label="Open sidebar"
                  >
                    <svg
                      className="h-6 w-6 text-gray-700 dark:text-gray-200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                )}

                <Link href={`/${userRole}/dashboard`} className="flex items-center">
                  <img
                    src="/shipquickr.png"
                    alt="Logo"
                    className="h-[57px] w-[145px]"
                  />
                </Link>
              </div>

              {/* Mobile Right — Wallet + Profile */}
              <div className="flex items-center gap-2">
                {userRole !== "admin" && (
                  <div className="flex items-center rounded-lg bg-gray-100 px-1 py-2 dark:bg-gray-800">
                    <Link href="/user/dashboard/wallet" className="flex items-center gap-2">
                      <Wallet className="mr-1 h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ₹{balance !== null ? balance.toFixed(2) : "0.00"}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Mobile Profile Avatar */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsProfileOpen(true)}
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <div
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#0a0c37] text-sm font-semibold text-gray-200 transition-colors hover:bg-[#0a0c37e1] dark:bg-gray-700 dark:text-gray-200"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    {getInitials(userName)}
                  </div>

                  {/* Mobile Dropdown */}
                  <div
                    ref={mobileDropdownRef}
                    className={`absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200/60 bg-white text-left shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-out origin-top-right dark:border-gray-700 dark:bg-gray-800 ${
                      isProfileOpen
                        ? "translate-y-0 scale-100 opacity-100 visible"
                        : "-translate-y-2 scale-95 pointer-events-none opacity-0 invisible"
                    }`}
                  >
                    {renderDropdownMenu(() => setIsProfileOpen(false))}
                  </div>
                </div>

                {/* Mobile Recharge Button */}
                {userRole !== "admin" && (
                  <button
                    onClick={handleRechargeClick}
                    className="flex items-center justify-center rounded-lg bg-[#0a0c37] p-2 text-white transition-colors hover:bg-[#0a0c37e1]"
                    aria-label="Recharge wallet"
                  >
                    <BatteryPlus className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Recharge Modal */}
      {userRole !== "admin" && (
        <RechargeModal
          isOpen={isRechargeModalOpen}
          onCloseAction={() => setIsRechargeModalOpen(false)}
          currentBalance={balance || 0}
        />
      )}
    </>
  );
}