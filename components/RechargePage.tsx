'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Download,
  Home,
  Search,
} from 'lucide-react';
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
  transactionId: string;
  bankTransactionId: string | null;
  type: string;
  status: string;
  receiptUrl: string | null;
};

const RechargePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [rechargeLogs, setRechargeLogs] = useState<RechargeLog[]>([]);
  const [balance, setBalance] = useState<number>(0);
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
          startDate: dateRange?.from
            ? format(dateRange.from, 'yyyy-MM-dd')
            : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          page,
          pageSize: PAGE_SIZE,
        };

        const res = await axios.get('/api/user/billing', { params });

        setBalance(res.data.balance || 0);
        setRechargeLogs(res.data.rechargeLogs || []);
        setTotal(res.data.totalCount || 0);
      } catch (err) {
        console.error('Failed to fetch recharge logs:', err);
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
    const headers = [
      'Date And Time',
      'Amount(Rs.)',
      'Transaction ID',
      "Bank's Transaction ID",
      'Type',
      'Status',
    ];

    const csvContent = [
      headers.join(','),
      ...(rechargeLogs || []).map((log) =>
        [
          format(new Date(log.date), 'yyyy-MM-dd HH:mm:ss'),
          log.amount,
          log.transactionId,
          log.bankTransactionId || '-',
          log.type,
          log.status,
        ].join(',')
      ),
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
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/user/dashboard"
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Recharge Logs</span>
          </div>

          <h1 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Recharge Logs
          </h1>

          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Current Balance
            </p>
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
                    variant="outline"
                    className={cn(
                      'w-[260px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
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
                  className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={downloadCSV}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
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
                  'cursor-pointer whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium',
                  pathname === '/user/dashboard/recharge'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                )}
              >
                Recharge Logs
              </Link>

              <Link
                href="/user/dashboard/shipping-charges"
                className={cn(
                  'cursor-pointer whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium',
                  pathname === '/user/dashboard/shipping-charges'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                )}
              >
                Shipping Charges
              </Link>
            </nav>
          </div>

          <div className="overflow-hidden bg-white shadow-lg dark:bg-gray-900">
            <div className="hidden lg:block">
              <div className="overflow-x-auto p-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Date And Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Amount(Rs.)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Transaction ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Bank&apos;s Transaction ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          <Loading />
                        </td>
                      </tr>
                    ) : rechargeLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      rechargeLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                {format(new Date(log.date), 'dd MMM yyyy')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {format(new Date(log.date), 'HH:mm a')}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'font-bold',
                                log.type === 'recharge' || log.type === 'credit'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              )}
                            >
                              ₹{log.amount.toFixed(2)}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {log.transactionId}
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {log.bankTransactionId || '-'}
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize dark:border-slate-700 dark:bg-slate-800">
                              {log.type}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                                log.status === 'Success'
                                  ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : log.status === 'Failed'
                                    ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              )}
                            >
                              {log.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {log.receiptUrl ||
                            (log.type === 'recharge' && log.status === 'Success') ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                asChild
                              >
                                <a
                                  href={log.receiptUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Invoice
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
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
                  <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                    No data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rechargeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <div
                            className={`text-lg font-bold ${
                              log.type === 'recharge' || log.type === 'credit'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            ₹{log.amount.toFixed(2)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                                log.status === 'Success'
                                  ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : log.status === 'Failed'
                                    ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              )}
                            >
                              {log.status}
                            </span>

                            {log.receiptUrl ||
                            (log.type === 'recharge' && log.status === 'Success') ? (
                              <a
                                href={log.receiptUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Transaction ID
                            </span>
                            <span className="font-mono text-xs text-slate-900 dark:text-slate-200">
                              {log.transactionId}
                            </span>
                          </div>

                          {log.bankTransactionId && (
                            <div className="flex justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Bank Txn ID
                              </span>
                              <span className="font-mono text-xs text-slate-900 dark:text-slate-200">
                                {log.bankTransactionId}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Type
                            </span>
                            <span className="font-medium capitalize text-slate-900 dark:text-slate-200">
                              {log.type}
                            </span>
                          </div>

                          <div className="mt-2 text-right text-[10px] font-medium text-slate-400">
                            {format(new Date(log.date), 'PPpp')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="text-sm font-medium text-slate-500">
                  Showing{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {total}
                  </span>{' '}
                  entries
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="cursor-pointer border-slate-200 dark:border-slate-800"
                  >
                    Previous
                  </Button>

                  <div className="flex min-w-[32px] items-center justify-center rounded-md bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {page}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="cursor-pointer border-slate-200 dark:border-slate-800"
                  >
                    Next
                  </Button>
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