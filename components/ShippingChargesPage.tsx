'use client'
import React, { useState, useEffect } from 'react';
import { Download, Search, Home, ChevronRight, Calendar as CalendarIcon, Package } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePathname } from 'next/navigation';

const PAGE_SIZE = 10;

type ShippingCharge = {
  id: number;
  date: string;
  courierName: string;
  amount: number;
  waybill: string;
  orderId: string;
  transactionId: number;
  paymentType: string;
  type: string;
  weight: string | number;
  zone: string;
  status: string;
  remarks: string;
};

const ShippingChargesPage: React.FC = () => {
  const [shippingCharges, setShippingCharges] = useState<ShippingCharge[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const pathname = usePathname();

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
        setShippingCharges(res.data.shippingCharges || []);
        setTotal(res.data.totalCount || 0);

      } catch (err) {
        console.error("Failed to fetch shipping charges:", err);
        setShippingCharges([]);
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
    console.log("Download CSV clicked");
    const headers = ["Date", "Courier", "Amount(Rs.)", "Waybill", "Order ID", "Transaction ID", "Weight", "Zone", "Status", "Remarks"];
    const csvContent = [
      headers.join(','),
      ...(shippingCharges || []).map(log => [
        format(new Date(log.date), "yyyy-MM-dd HH:mm:ss"),
        log.courierName,
        log.amount,
        log.waybill,
        log.orderId,
        log.transactionId,
        log.weight,
        log.zone,
        log.status,
        log.remarks?.replace(/"/g, '""')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shipping_charges_page_${page}.csv`);
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
            <span>Shipping Charges</span>
          </div>

          <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Shipping Charges</h1>

          <div className="mb-6 bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700">
            <p className="text-sm text-blue-600 dark:text-blue-300">Current Balance</p>
            <p className="text-2xl font-semibold text-blue-800 dark:text-blue-200">
              ₹{balance.toFixed(2)}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => { setDateRange(range); setPage(1); }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <div className="relative flex-grow max-w-xs">
              <Input
                type="text"
                placeholder="Search by Waybill/Order ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead>Date</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Amount (Rs.)</TableHead>
                    <TableHead>Waybill</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-500 py-7">
                        <Loading />
                      </TableCell>
                    </TableRow>
                  ) : (shippingCharges.length > 0 ? (
                    shippingCharges.map((charge) => {
                      const baseAmount = charge.amount / 1.18;
                      const gstAmount = charge.amount - baseAmount;
                      return (
                        <TableRow key={charge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <TableCell>{format(new Date(charge.date), "yyyy-MM-dd HH:mm")}</TableCell>
                          <TableCell>{charge.courierName}</TableCell>
                          <TableCell className="text-right"><div>{charge.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                              (Base: {baseAmount.toFixed(2)} + GST: {gstAmount.toFixed(2)})
                            </div></TableCell>
                          <TableCell>{charge.waybill}</TableCell>
                          <TableCell>{charge.orderId}</TableCell>
                          <TableCell>{charge.transactionId}</TableCell>
                          <TableCell>{charge.paymentType}</TableCell>
                          <TableCell>{charge.weight}</TableCell>
                          <TableCell>{charge.zone}</TableCell>
                          <TableCell>{charge.status}</TableCell>
                          <TableCell className="max-w-xs truncate">{charge.remarks}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-gray-500">
                        No shipping charges found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-[calc(70vh-280px)] overflow-y-auto">
                <div className="space-y-3 p-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loading />
                    </div>
                  ) : shippingCharges.length > 0 ? (
                    shippingCharges.map((charge) => {
                      const baseAmount = charge.amount / 1.18;
                      const gstAmount = charge.amount - baseAmount;
                      return (
                        <div key={charge.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-1 break-all">
                                Order ID: {charge.orderId}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(charge.date), "PPpp")}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-red-600 dark:text-red-400 ml-2">
                                - ₹{charge.amount.toFixed(2)}
                              </span>
                              <div className="text-xs text-gray-400 whitespace-nowrap">
                                (Base: {baseAmount.toFixed(2)} + GST: {gstAmount.toFixed(2)})
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Waybill</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100 break-words">{charge.waybill || '-'}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Courier</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.courierName}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Weight</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.weight}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Zone</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.zone}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.status}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction ID</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.transactionId}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{charge.paymentType}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Remarks</div>
                              <div className="text-gray-800 dark:text-gray-100 text-xs break-words">{charge.remarks || "-"}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center">
                      <Package className="h-12 w-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        No Shipping Charges
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No charges found for the selected criteria.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!loading && total > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ShippingChargesPage;