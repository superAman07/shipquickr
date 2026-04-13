'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ChevronRight, Search, Loader2, FileWarning, ExternalLink, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ComplaintStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Complaint {
  id: number;
  awbNumber: string;
  issue: string;
  fileUrl: string | null;
  status: ComplaintStatus;
  adminRemarks: string | null;
  createdAt: string;
  userId: number;
}

interface ApiResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  complaints: Complaint[];
}

const statusConfig: Record<ComplaintStatus, { color: string; icon: any }> = {
  open: {
    color:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: AlertCircle,
  },
  pending: {
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    icon: Clock,
  },
  closed: {
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
};

export default function RaisedComplaintUserPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComplaints = useCallback(
    async (search = searchTerm) => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        });

        if (search) {
          params.append('search', search);
        }

        if (statusFilter) {
          params.append('status', statusFilter);
        }

        const response = await axios.get<ApiResponse>(
          `/api/user/complaints?${params.toString()}`
        );

        const {
          complaints: fetchedComplaints,
          total,
          page,
          totalPages: fetchedTotalPages,
        } = response.data;

        setComplaints(fetchedComplaints);
        setTotalComplaints(total);
        setCurrentPage(page);
        setTotalPages(fetchedTotalPages);
      } catch (error: any) {
        console.error('Error fetching complaints:', error);
        toast.error(error.response?.data?.error || 'Failed to fetch complaints.');
        setComplaints([]);
        setTotalComplaints(0);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, statusFilter, searchTerm]
  );

  useEffect(() => {
    if (debounceTimeoutRef.current === null) {
      fetchComplaints();
    }
  }, [currentPage, pageSize, statusFilter, fetchComplaints]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchComplaints(searchTerm);
      debounceTimeoutRef.current = null;
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchComplaints]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (status: ComplaintStatus | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalComplaints);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 dark:bg-[#0F172A] md:p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/user/dashboard"
          className="cursor-pointer transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Raised Complaints
        </span>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Raised Complaints
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Track the status of your reported issues
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-xl font-bold dark:text-white">
              Complaints History
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(null)}
                className={cn(
                  'cursor-pointer',
                  statusFilter === null
                    ? 'bg-indigo-600 text-white'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                All
              </Button>

              {(Object.keys(statusConfig) as ComplaintStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange(status)}
                  className={cn(
                    'cursor-pointer capitalize',
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-10 w-[80px] cursor-pointer border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by AWB or Issue..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-10 rounded-lg border-slate-200 bg-white pl-10 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 lg:hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="font-medium text-slate-500">
                  Loading history...
                </span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileWarning className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  No complaints found.
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  You haven&apos;t raised any complaints yet.
                </p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        ID: #{complaint.id}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {format(
                          new Date(complaint.createdAt),
                          'dd MMM yyyy, HH:mm a'
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold',
                        statusConfig[complaint.status].color
                      )}
                    >
                      <span className="capitalize">{complaint.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          AWB Number
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-200">
                          {complaint.awbNumber}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          File
                        </div>
                        {complaint.fileUrl ? (
                          <a
                            href={complaint.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Issue Description
                      </div>
                      <div className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {complaint.issue}
                      </div>
                    </div>

                    {complaint.adminRemarks && (
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/20 dark:bg-amber-900/10">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Admin Resolution
                        </div>
                        <div className="text-sm italic text-slate-700 dark:text-amber-200">
                          &quot;{complaint.adminRemarks}&quot;
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block dark:border-slate-800">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[60px] font-bold">S.No</TableHead>
                  <TableHead className="font-bold">Date & ID</TableHead>
                  <TableHead className="font-bold">AWB Number</TableHead>
                  <TableHead className="max-w-[200px] font-bold">
                    Issue Description
                  </TableHead>
                  <TableHead className="font-bold">Resolution / Remarks</TableHead>
                  <TableHead className="font-bold">Attachment</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="font-medium text-slate-500">
                          Fetching records...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileWarning className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                        <p className="font-medium text-slate-500">
                          No complaints found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint, index) => (
                    <TableRow
                      key={complaint.id}
                      className="border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium text-slate-400">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400">
                            #{complaint.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                            {format(new Date(complaint.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="rounded bg-indigo-50 px-2 py-1 font-mono font-bold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                          {complaint.awbNumber}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <p
                          className="truncate text-slate-600 dark:text-slate-300"
                          title={complaint.issue}
                        >
                          {complaint.issue}
                        </p>
                      </TableCell>

                      <TableCell className="max-w-[250px]">
                        {complaint.adminRemarks ? (
                          <p className="font-medium leading-relaxed text-amber-600 italic dark:text-amber-400 text-xs">
                            &quot;{complaint.adminRemarks}&quot;
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Waiting for response...
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {complaint.fileUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 cursor-pointer text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                            asChild
                          >
                            <a
                              href={complaint.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              View
                            </a>
                          </Button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold',
                            statusConfig[complaint.status].color
                          )}
                        >
                          <span className="capitalize">{complaint.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Desktop Pagination */}
          {!isLoading && totalComplaints > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 pt-6 text-sm text-slate-500 sm:flex-row">
              <div>
                Showing <span className="font-bold">{startIndex}</span> to{' '}
                <span className="font-bold">{endIndex}</span> of{' '}
                <span className="font-bold">{totalComplaints}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="cursor-pointer border-slate-200 dark:border-slate-800"
                >
                  Previous
                </Button>

                <div className="flex w-20 items-center justify-center">
                  <span className="font-bold text-indigo-600">
                    Page {currentPage}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer border-slate-200 dark:border-slate-800"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}