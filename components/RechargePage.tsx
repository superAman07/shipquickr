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
import { usePathname } from 'next/navigation';


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
  const pathname = usePathname();
  const PAGE_SIZE = 10;

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
        setRechargeLogs(res.data.rechargeLogs || []);
        setTotal(res.data.totalCount || 0); 

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
     const headers = ["Date And Time", "Amount(Rs.)", "Transaction ID", "Bank's Transaction ID", "Type", "Status"];
    const csvContent = [
        headers.join(','),
        ...(rechargeLogs || []).map(log => [  
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
    link.setAttribute('download', `recharge_logs_page_${page}.csv`);  
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

          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <Link
                href="/user/dashboard/recharge"
                className={cn(
                  'whitespace-nowrap cursor-pointer py-3 px-1 border-b-2 font-medium text-sm',
                  pathname === '/user/dashboard/recharge'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Recharge Logs
              </Link>
              <Link
                href="/user/dashboard/shipping-charges"
                className={cn(
                  'whitespace-nowrap cursor-pointer py-3 px-1 border-b-2 font-medium text-sm',
                  pathname === '/user/dashboard/shipping-charges'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Shipping Charges
              </Link>
            </nav>
          </div>
 
          <div className="overflow-hidden shadow-lg bg-white dark:bg-gray-900">
            <div className="hidden lg:block">
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
            {/* Mobile View */}
            <div className="block lg:hidden">
              <div className="h-[calc(100vh-550px)] overflow-y-auto p-4">
                {loading ? (
                  <Loading />
                ) : rechargeLogs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">No data available</div>
                ) : (
                  <div className="space-y-4">
                    {rechargeLogs.map((log) => (
                      <div key={log.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <div className={`font-bold text-lg ${log.type === 'recharge' || log.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            ₹{log.amount.toFixed(2)}
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              log.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : log.status === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Transaction ID</div>
                            <div className="text-gray-800 dark:text-gray-200 font-mono text-xs">{log.transactionId}</div>
                          </div>
                          {log.bankTransactionId && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Bank Txn ID</div>
                              <div className="text-gray-800 dark:text-gray-200 font-mono text-xs">{log.bankTransactionId}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
                            <div className="text-gray-800 dark:text-gray-200 capitalize">{log.type}</div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {format(new Date(log.date), "PPpp")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Showing <span className="font-bold">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-bold">{Math.min(page * PAGE_SIZE, total)}</span> of <span className="font-bold">{total}</span> entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 rounded-md shadow border-blue-300 bg-blue-100 text-blue-700 text-sm font-bold dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    {page}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    disabled={page === totalPages || totalPages === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RechargePage;