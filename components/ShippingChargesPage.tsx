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
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAGE_SIZE = 10;

type ShippingCharge = {
  id: number;
  date: string;
  courierName: string;
  amount: number;
  waybill: string;
  orderId: string; 
  transactionId: number;
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
            <span>Billings</span>
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
 
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">

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
                      shippingCharges.map((charge) => (
                        <TableRow key={charge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <TableCell>{format(new Date(charge.date), "yyyy-MM-dd HH:mm")}</TableCell>
                          <TableCell>{charge.courierName}</TableCell>
                          <TableCell className="text-right">{charge.amount.toFixed(2)}</TableCell>
                          <TableCell>{charge.waybill}</TableCell>
                          <TableCell>{charge.orderId}</TableCell>
                          <TableCell>{charge.transactionId}</TableCell>
                          <TableCell>{charge.weight}</TableCell>
                          <TableCell>{charge.zone}</TableCell>
                          <TableCell>{charge.status}</TableCell>
                          <TableCell className="max-w-xs truncate">{charge.remarks}</TableCell>
                        </TableRow>
                      ))
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