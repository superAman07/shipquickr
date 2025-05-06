"use client";

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface WalletContextType {
  balance: number | null;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    console.log("WalletContext: Attempting to fetch balance...");
    setIsLoadingBalance(true);
    try {
      const response = await axios.get('/api/user/wallet');  
      if (response.data && typeof response.data.balance === 'number') {
        setBalance(response.data.balance);
        console.log("WalletContext: Balance fetched successfully:", response.data.balance);
      } else {
        setBalance(0);  
        console.warn("WalletContext: Fetched balance is invalid or not found, defaulting to 0.", response.data);
      }
    } catch (error) { 
      toast.error("Could not load wallet balance.");  
      setBalance(0);  
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <WalletContext.Provider value={{ balance, isLoadingBalance, refreshBalance: fetchBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};