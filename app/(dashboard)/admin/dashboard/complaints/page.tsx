'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Search,
  Home,
  ChevronRight,
  Loader2,
  FileWarning,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';

type ComplaintStatus = 'open' | 'pending' | 'closed';

interface Complaint {
  id: number;
  awbNumber: string;
  issue: string;
  fileUrl: string | null;
  status: ComplaintStatus;
  adminRemarks: string | null;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
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

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('open');
  const [remarks, setRemarks] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await axios.get(`/api/admin/complaints?${params.toString()}`);
      setComplaints(res.data.complaints || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setSubmitting(true);

    try {
      await axios.patch('/api/admin/complaints', {
        complaintId: selectedComplaint.id,
        status: newStatus,
        remarks,
      });

      toast.success('Complaint updated successfully');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setRemarks(complaint.adminRemarks || '');
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 dark:bg-[#0F172A] md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/admin/dashboard"
            className="cursor-pointer transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            System Complaints
          </span>
        </div>

        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Complaints Management
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Track and resolve user issues and tickets
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-8 border border-slate-200 border-none bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[300px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by AWB, Issue, or User Email..."
                  className="border-slate-200 bg-white pl-10 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] cursor-pointer border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All Status
                  </SelectItem>
                  <SelectItem
                    value="open"
                    className="cursor-pointer text-blue-600 dark:text-blue-400"
                  >
                    Open
                  </SelectItem>
                  <SelectItem
                    value="pending"
                    className="cursor-pointer text-yellow-600 dark:text-yellow-400"
                  >
                    Pending
                  </SelectItem>
                  <SelectItem
                    value="closed"
                    className="cursor-pointer text-emerald-600 dark:text-emerald-400"
                  >
                    Closed
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setPage(1);
                  fetchData();
                }}
                className="cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card className="overflow-hidden border border-slate-200 border-none bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[150px]">Date</TableHead>
                  <TableHead className="min-w-[200px]">User Info</TableHead>
                  <TableHead className="min-w-[150px]">AWB Number</TableHead>
                  <TableHead className="min-w-[250px]">Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                        <span className="font-medium text-slate-500">
                          Loading complaints...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileWarning className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          No Complaints Found
                        </h3>
                        <p className="text-slate-500">
                          Try adjusting your filters or search term
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => {
                    const status = statusConfig[complaint.status];

                    return (
                      <TableRow
                        key={complaint.id}
                        className="border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="font-mono text-xs text-slate-500">
                          #{complaint.id}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              {format(new Date(complaint.createdAt), 'dd MMM yyyy')}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(complaint.createdAt), 'HH:mm a')}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold capitalize text-slate-900 dark:text-indigo-400">
                              {complaint.user.firstName} {complaint.user.lastName}
                            </span>
                            <span className="text-xs italic text-slate-500">
                              {complaint.user.email}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="rounded bg-indigo-50 px-2 py-1 font-mono font-bold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                            {complaint.awbNumber}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[300px]">
                          <p
                            className="truncate text-slate-600 dark:text-slate-300"
                            title={complaint.issue}
                          >
                            {complaint.issue}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
                              status.color
                            )}
                          >
                            <status.icon className="h-3.5 w-3.5" />
                            <span className="capitalize">{complaint.status}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer bg-slate-100 text-indigo-600 transition-all hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                            onClick={() => openModal(complaint)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Respond
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && complaints.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing <span className="font-bold">{(page - 1) * 10 + 1}</span> to{' '}
                <span className="font-bold">{Math.min(page * 10, total)}</span> of{' '}
                <span className="font-bold">{total}</span> complaints
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="cursor-pointer"
                >
                  Previous
                </Button>

                <div className="flex w-24 items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">
                    Page {page} / {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Respond Modal */}
        {modalOpen && selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                    <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">
                      Respond to Complaint
                    </h2>
                    <p className="text-sm text-slate-500">
                      Ticket #{selectedComplaint.id} • AWB:{' '}
                      {selectedComplaint.awbNumber}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      User Details
                    </label>
                    <p className="font-semibold capitalize text-slate-900 dark:text-white">
                      {selectedComplaint.user.firstName}{' '}
                      {selectedComplaint.user.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedComplaint.user.email}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Attachment
                      </label>
                      {selectedComplaint.fileUrl ? (
                        <a
                          href={selectedComplaint.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex cursor-pointer items-center gap-1.5 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <Eye className="h-4 w-4" />
                          View File
                        </a>
                      ) : (
                        <span className="italic text-slate-400">
                          No file uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    User&apos;s Issue
                  </label>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                    <p className="leading-relaxed italic text-slate-700 dark:text-amber-200">
                      &quot;{selectedComplaint.issue}&quot;
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Update Status
                    </label>
                    <Select
                      value={newStatus}
                      onValueChange={(val) => setNewStatus(val as ComplaintStatus)}
                    >
                      <SelectTrigger className="w-full cursor-pointer bg-white dark:bg-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        <SelectItem value="open" className="cursor-pointer">
                          Open (Active Issue)
                        </SelectItem>
                        <SelectItem value="pending" className="cursor-pointer">
                          Pending (Under Investigation)
                        </SelectItem>
                        <SelectItem value="closed" className="cursor-pointer">
                          Closed (Resolved)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Admin Remarks
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      placeholder="Enter resolution details or remarks for the user..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setModalOpen(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="cursor-pointer bg-indigo-600 px-8 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Save Response
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}