'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Wallet, Bell, ChevronDown, User, Lock, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import LogoutButton from './logout';
import Link from 'next/link';


export default function Navbar({ userRole , userName}: { userRole: string , userName: string}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);  

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
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ShipQuickr
            </div>
          </div>
          <div className="flex items-center gap-4">
          {userRole !== "admin" && (
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <Link href="/user/dashboard/wallet" className="flex items-center gap-2 px-4 ...">
                <Wallet className="..." />
                <span className="text-green-600 dark:text-green-400 font-semibold">₹ 0.00</span>
              </Link>
            </div>
          )} 
            <button
              type="button"
              onClick={()=>setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>  
            <div className="relative cursor-pointer">
              <button
                type='button'
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
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
                  <Link href={""} className="flex items-center gap-2 px-4 hover:bg-red-400 text-gray-700 dark:text-gray-300 ">
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