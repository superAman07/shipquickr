'use client'
import React, { useState, useEffect } from 'react';
import { Download, Search, Home, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import Loading from '@/app/loading';
import { format } from 'date-fns'; 
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';  
import { Button } from '@/components/ui/button';  
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';  
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const PAGE_SIZE = 10;
 
type RechargeLog = {
  id: number;
  date: string;
  amount: number;
  transactionId: number;
  bankTransactionId: string | null;
  type: string;
  status: string;
};

const RechargePage: React.FC = () => { 
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [rechargeLogs, setRechargeLogs] = useState<RechargeLog[]>([]);  
  const [balance, setBalance] = useState<number>(0);   ;
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try { 
        const params = { 
          search: searchTerm,
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          page,
          pageSize: PAGE_SIZE,
        }; 
        const res = await axios.get('/api/user/billing', { params });
        setBalance(res.data.balance || 0);
        const allLogs = res.data.rechargeLogs || [];

        const filteredLogs = allLogs.filter((log: RechargeLog) => {
            const logDate = new Date(log.date);
            const matchesSearch = !searchTerm ||
                log.transactionId.toString().includes(searchTerm) ||
                log.bankTransactionId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate =
                !dateRange ||
                !dateRange.from ||
                !dateRange.to ||
                (logDate >= dateRange.from && logDate <= dateRange.to);

            return matchesSearch && matchesDate; 
        });

        setTotal(filteredLogs.length);
        const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        setRechargeLogs(paginatedLogs);
        
      } catch (err) {
        console.error("Failed to fetch recharge logs:", err);
        setRechargeLogs([]);
        setBalance(0);
        setTotal(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [searchTerm, dateRange, page]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); 
  };

  const downloadCSV = () => { 
     const filteredLogsForDownload = (rechargeLogs || []).filter((log: RechargeLog) => { // Use rechargeLogs state which is already filtered/paginated OR re-fetch all filtered data
            const logDate = new Date(log.date);
            const matchesSearch = !searchTerm ||
                log.transactionId.toString().includes(searchTerm) ||
                log.bankTransactionId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate =
                !dateRange ||
                !dateRange.from ||
                !dateRange.to ||
                (logDate >= dateRange.from && logDate <= dateRange.to);
            return matchesSearch && matchesDate;
        });

    const headers = ["Date And Time", "Amount(Rs.)", "Transaction ID", "Bank's Transaction ID", "Type", "Status"];
    const csvContent = [
        headers.join(','),
        ...filteredLogsForDownload.map(log => [ 
            format(new Date(log.date), "yyyy-MM-dd HH:mm:ss"),
            log.amount,
            log.transactionId,
            log.bankTransactionId || "-",
            log.type,
            log.status
        ].join(','))
    ].join('\n');

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'recharge_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <main className="p-6">
        <div className="max-w-7xl mx-auto"> 
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Billings</span>
             <ChevronRight className="h-4 w-4" />
            <span>Recharge Logs</span>
          </div>
 
          <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Recharge Logs</h1>
 
          <div className="mb-6 bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700">
            <p className="text-sm text-blue-600 dark:text-blue-300">Current Balance</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-white">
              ₹{balance.toFixed(2)}
            </p>
          </div>

          
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ShadcnCalendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                        setDateRange(range);  
                        setPage(1);  
                    }}
                    numberOfMonths={2} 
                  />
                </PopoverContent>
              </Popover>
 
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Transaction ID"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div> 
            <button
              type="button"
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              title="Download CSV"
            >
              <Download className="h-5 w-5" />
              Download
            </button>
          </div>
 
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">
            <div>
              <div className="overflow-x-auto p-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date And Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount(Rs.)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bank's Transaction ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          <Loading/>
                        </td>
                      </tr>
                    ) : rechargeLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          No data available in table
                        </td>
                      </tr>
                    ) : ( 
                      rechargeLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3">{format(new Date(log.date), "PPpp")}</td> {/* Format date */}
                          <td className="px-4 py-3">₹{log.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">{log.transactionId}</td>
                          <td className="px-4 py-3">{log.bankTransactionId || "-"}</td>
                          <td className="px-4 py-3">{log.type}</td>
                          <td className="px-4 py-3">{log.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} entries
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={page === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RechargePage;