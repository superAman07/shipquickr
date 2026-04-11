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
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchType, setSearchType] = useState("AWB No");

  // Debounced search effect
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
        return;
      }
      setIsSearching(true);
      setIsSearchDropdownOpen(true);
      try {
        // Logic still hits the global search but the placeholder guides the user
        const res = await fetch(`/api/${userRole}/search?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, userRole]);

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
            <div className="hidden max-w-xl flex-1 items-center px-4 lg:px-8 md:flex relative group">
              <div className="flex w-full items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800">
                
                {/* Search By Filter */}
                <div className="relative flex-none">
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="h-10 cursor-pointer appearance-none border-r border-gray-100 bg-gray-50/30 px-4 pr-9 text-[12px] font-bold text-gray-500 outline-none hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                  >
                    <option>Search By.</option>
                    <option>AWB No</option>
                    <option>Order ID</option>
                    <option>Mobile No</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                </div>
                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setIsSearchDropdownOpen(true)}
                    placeholder={`Search ${searchType}...`}
                    className="h-10 w-full bg-transparent px-4 text-[13px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-200"
                  />
                </div>
                {/* Search Icon Button */}
                <button className="flex h-10 w-11 items-center justify-center bg-[#0a0c37] text-white transition-all hover:bg-indigo-950 active:scale-95 cursor-pointer">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
              {/* Search Results Dropdown */}
              {isSearchDropdownOpen && (
                <div className="absolute top-full left-4 right-4 z-[60] mt-1 pr-2 max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 custom-scrollbar">
                  {searchResults.length > 0 ? (
                    searchResults.map((order: any) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          router.push(`/${userRole}/dashboard/order-details/${order.id}`);
                          setIsSearchDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-gray-100 p-3.5 transition-all hover:bg-indigo-50/40 hover:border-indigo-100 dark:border-gray-700 dark:hover:bg-gray-700/50 dark:hover:border-gray-600 mb-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate text-sm font-extrabold text-[#0a0c37] group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                              {order.awbNumber || order.orderId}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{order.customerName}</span>
                              <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{order.paymentMode}</span>
                              <span className={`h-1.5 w-1.5 rounded-full ${order.paymentMode === 'COD' ? 'bg-orange-400' : 'bg-green-400'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : !isSearching && (
                    <div className="p-6 text-center text-sm font-bold text-gray-400">No results found for "{searchQuery}"</div>
                  )}
                </div>
              )}
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