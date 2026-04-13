'use client';

import React, { FormEvent, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronRight, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ComplaintUserPage() {
  const [awb, setAwb] = useState('');
  const [issues, setIssues] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setFile(null);
      setFileName('No file chosen');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!awb || !issues) {
      toast.error('AWB Number and Issues are required.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('awb', awb);
    formData.append('issues', issues);

    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await axios.post('/api/user/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message || 'Complaint submitted successfully!');
      setAwb('');
      setIssues('');
      setFile(null);
      setFileName('No file chosen');
    } catch (error: any) {
      console.error('Complaint submission error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to submit complaint.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setAwb('');
    setIssues('');
    setFile(null);
    setFileName('No file chosen');
  };

    return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 dark:bg-[#0F172A] md:p-4">
      {/* 1. COMPACT BREADCRUMBS */}
      <div className="mx-auto max-w-5xl mb-3 flex items-center gap-2 text-[12px] text-slate-500">
        <Link href="/user/dashboard" className="transition-colors hover:text-indigo-600">
          <Home className="h-3 w-3" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-700 dark:text-slate-400">Raise Complaint</span>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* 2. COMPACT HEADER */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Raise A Complaint
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide details below for faster resolution
          </p>
        </div>

        <Card className="w-full overflow-hidden rounded-xl border border-slate-200 border-none bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* 3. THINNER CARD HEADER */}
          <CardHeader className="border-b border-slate-200 bg-slate-50 py-3 px-5 dark:border-slate-800 dark:bg-slate-800/50">
            <CardTitle className="text-lg font-bold dark:text-white">Ticket Details</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-5">
              {/* 4. TWO-COLUMN GRID FOR MAIN INPUTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* AWB Number (Left Column) */}
                <div className="space-y-1.5">
                  <Label htmlFor="awb" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    AWB Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="awb"
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                    placeholder="Enter AWB number"
                    required
                    className="h-10 border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                    disabled={isLoading}
                  />
                </div>

                {/* Upload Evidence (Right Column) - Compact Mode */}
                <div className="space-y-1.5">
                  <Label htmlFor="file" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload Evidence (PDF/Image)
                  </Label>
                  <div className="flex h-10 items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 px-2 dark:border-slate-700 dark:bg-slate-800/30">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,audio/*,image/*"
                      className="hidden"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file')?.click()}
                      disabled={isLoading}
                      className="h-7 cursor-pointer border-slate-200 py-0 text-xs hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      Browse
                    </Button>
                    <span className="flex-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {fileName}
                    </span>
                  </div>
                </div>

                {/* Describe the Issue (Full Width Row) */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="issues" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Describe the Issue <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="issues"
                    value={issues}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIssues(e.target.value)}
                    placeholder="Explain the problem in detail..."
                    required
                    rows={3}
                    className="min-h-[80px] border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400 italic font-medium">* Required fields</p>
            </CardContent>

            {/* 5. SLIM FOOTER */}
            <CardFooter className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 py-3 px-5 dark:border-slate-800 dark:bg-slate-800/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="h-9 cursor-pointer text-xs text-slate-500 hover:text-slate-700"
              >
                Clear
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-9 min-w-[120px] cursor-pointer bg-indigo-600 text-sm font-bold text-white shadow-indigo-500/10 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Submitting...</>
                ) : (
                  'Create Ticket'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}