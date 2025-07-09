'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Wallet, ChevronDown, User, Lock, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import LogoutButton from './logout';
import Link from 'next/link';  
import { useWallet as useActualWallet, WalletContextType } from '@/contexts/WalletContext'; // Renamed and import type



const useConditionalWallet = (userRole: string): WalletContextType => {
  if (userRole !== 'admin') {
    return useActualWallet();
  }
  return { 
    balance: null, 
    isLoadingBalance: false, 
    refreshBalance: async () => {}, 
  };
};

export default function Navbar({ userRole , userName}: { userRole: string , userName: string}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const { balance, isLoadingBalance } = useConditionalWallet(userRole);

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    const firstName = names[0] || '';
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);  
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-8xl mx-auto  sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="">
              <Link href={`/${userRole}/dashboard`} className="flex items-center">
                <img src="/shipquickr.png" alt="Logo" className="h-[57px] w-[145px]" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
          {userRole !== "admin" && (
            <div className="md:flex items-center bg-gray-100 dark:bg-gray-800 px-0 md:px-4 py-2 rounded-lg">
              <Link href="/user/dashboard/wallet" className="flex items-center gap-2 px-2 md:px-4 ...">
                <Wallet className="..." />
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {isLoadingBalance ? "Loading..." : `₹${balance !== null ? balance.toFixed(2) : '0.00'}`}
                </span>
              </Link>
            </div>
          )} 
            {/* <button
              type="button"
              onClick={()=>setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>   */}
            <div className="relative cursor-pointer">
              <button
                type='button'
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="h-8 w-8 rounded-full bg-[#0a0c37] dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-200 dark:text-gray-200">
                  {getInitials(userName)}
                </div>
                <span className="cursor-pointer hidden md:block text-gray-700 dark:text-gray-300">{userName}</span>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>

              {isProfileOpen && (
                <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                  <Link href={`/${userRole}/dashboard/profile`} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                    Your Profile
                  </Link>
                  <Link href={`/${userRole}/dashboard/change-password`} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                    Change Password
                  </Link>
                  <hr />
                  <Link href={""} className="flex items-center gap-2 px-4 hover:bg-gray-200 text-gray-700 dark:text-gray-300 ">
                    <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                    <LogoutButton propUser={userRole} propStyle={{color: "text-gray-500 dark:text-gray-200"}} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}