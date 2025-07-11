'use client';

import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Home,  Loader2 } from 'lucide-react'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';

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
            console.error("Complaint submission error:", error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to submit complaint.';
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
        <div className="p-4 md:p-6 lg:p-8"> 
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-100 sm:text-gray-500 dark:text-gray-400">
                <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>Raise Complaint</span>
            </div>
            <h1 className="text-2xl font-semibold mb-6 text-gray-100 sm:text-gray-800 dark:text-gray-200">Raise Complaints</h1>
            <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold">Raise Complaint</CardTitle>
                    <CardDescription>Fill in the details below to submit your complaint.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="awb">AWB Number <span className="text-red-500">*</span></Label>
                            <Input
                                id="awb"
                                value={awb}
                                onChange={(e) => setAwb(e.target.value)}
                                placeholder="Enter the Air Waybill number"
                                required
                                className="bg-background text-foreground border-border"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="issues">Issues <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="issues"
                                value={issues}
                                onChange={(e:any) => setIssues(e.target.value)}
                                placeholder="Describe the issues you are facing"
                                required
                                rows={4}
                                className="bg-background text-foreground border-border"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Upload File (pdf, audio, jpg)</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,audio/*,image/jpeg" 
                                    className="hidden"  
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('file')?.click()}
                                    disabled={isLoading}
                                    className="border-border hover:bg-muted"
                                >
                                    Choose File
                                </Button>
                                <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                                    {fileName}
                                </span>
                            </div>
                             <p className="text-xs text-muted-foreground pt-1">Max file size: 5MB.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}