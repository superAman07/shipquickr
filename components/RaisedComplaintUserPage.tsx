'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import axios from 'axios';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ChevronRight, Search, Loader2, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { ComplaintStatus } from '@prisma/client';
import { cn } from '@/lib/utils'; 

interface Complaint {
    id: number;
    awbNumber: string;
    issue: string;
    fileUrl: string | null;
    status: ComplaintStatus;
    remarks: string | null;
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

const statusColors: Record<ComplaintStatus, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const getStatusColor = (status: ComplaintStatus): string => {
    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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

    const fetchComplaints = useCallback(async (search = searchTerm) => { 
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

            const response = await axios.get<ApiResponse>(`/api/user/complaints?${params.toString()}`);
            const { complaints: fetchedComplaints, total, page, totalPages: fetchedTotalPages } = response.data;

            setComplaints(fetchedComplaints);
            setTotalComplaints(total);
            setCurrentPage(page);
            setTotalPages(fetchedTotalPages);
        } catch (error: any) {
            console.error("Error fetching complaints:", error);
            toast.error(error.response?.data?.error || "Failed to fetch complaints.");
            setComplaints([]);
            setTotalComplaints(0);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        } 
    }, [currentPage, pageSize, statusFilter, searchTerm]);
 
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
        <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-[#10162A]">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    <Home className="h-4 w-4" />
                </Link> 
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-700 dark:text-gray-200">Raised Complaints</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Raised Complaints</h1>

            <Card className="bg-card text-card-foreground shadow-md border border-border">
                <CardHeader>
                    <CardTitle className="text-xl font-medium">Complaints List</CardTitle>
                    <div className="flex flex-wrap gap-2 pt-4">
                        <Button
                            variant={statusFilter === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusFilterChange(null)}
                            className={cn(statusFilter === null ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted")}
                        >
                            All
                        </Button>
                        {(Object.keys(statusColors) as ComplaintStatus[]).map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusFilterChange(status)}
                                className={cn(
                                    statusFilter === status
                                        ? "bg-primary text-primary-foreground"
                                        : "border-border hover:bg-muted",
                                    "capitalize"  
                                )}
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent> 
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span>Show</span>
                            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-[70px] h-8 bg-background border-border">
                                    <SelectValue placeholder="Size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>entries</span>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by AWB or Issue..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10 h-9 bg-background border-border"
                            />
                        </div>
                    </div>
 
                    <div className="overflow-x-auto border border-border rounded-md">
                        <Table className="min-w-full">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">S.No</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Complaint ID</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Complaint Date</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">AWB No.</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Issue</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Complaint Remarks</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Complaint Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border text-sm">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span className="ml-2">Loading complaints...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : complaints.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <FileWarning className="h-10 w-10 mb-2" />
                                                No complaints found matching your criteria.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    complaints.map((complaint, index) => (
                                        <TableRow key={complaint.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="px-4 py-3">{startIndex + index}</TableCell>
                                            <TableCell className="px-4 py-3 font-medium">{complaint.id}</TableCell>
                                            <TableCell className="px-4 py-3">{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="px-4 py-3">{complaint.awbNumber}</TableCell>
                                            <TableCell className="px-4 py-3 max-w-xs truncate" title={complaint.issue}>{complaint.issue}</TableCell>
                                            <TableCell className="px-4 py-3">{complaint.remarks || '-'}</TableCell> {/* Handle potentially null remarks */}
                                            <TableCell className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(complaint.status)}`}>
                                                    {complaint.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
 
                    {!isLoading && totalComplaints > 0 && (
                         <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
                            <div>
                                Showing {startIndex} to {endIndex} of {totalComplaints} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="h-8 border-border hover:bg-muted"
                                >
                                    Previous
                                </Button>
                                <span className="px-2 font-medium">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="h-8 border-border hover:bg-muted"
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