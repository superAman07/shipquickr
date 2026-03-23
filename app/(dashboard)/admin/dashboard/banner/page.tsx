'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Editor from '@/components/Editor/Editor';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Home, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

export default function BannerManagement() {
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('bg-[linear-gradient(to_right,#f59e0b,#ea580c)]');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await axios.get('/api/admin/banner');
      if (response.data) {
        setContent(response.data.content || '');
        setBackgroundColor(response.data.backgroundColor || 'bg-[linear-gradient(to_right,#f59e0b,#ea580c)]');
        setIsActive(response.data.isActive || false);
      }
    } catch (error) {
      toast.error("Failed to fetch banner settings");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post('/api/admin/banner', {
        content,
        backgroundColor,
        isActive
      });
      toast.success("Banner updated successfully");
      fetchBanner();
    } catch (error) {
      toast.error("Failed to update banner");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus); // Optimistic UI update
    try {
      await axios.post('/api/admin/banner', {
        content,
        backgroundColor,
        isActive: newStatus
      });
      toast.success(newStatus ? "Banner Activated! Users will now see it." : "Banner Deactivated");
    } catch (error) {
      setIsActive(!newStatus); // Revert on failure
      toast.error("Failed to toggle status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">Global Banner Settings</h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
              <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300">
                <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
              <span className="font-medium">Banner Management</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">Banner Configuration</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Visibility:</span>
              <button onClick={toggleStatus} className="focus:outline-none transition-transform hover:scale-105">
                {isActive ? (
                  <ToggleRight className="h-10 w-10 text-green-500" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-gray-400" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Background Color (Tailwind classes)</label>
              <Input 
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="e.g. bg-blue-500 OR bg-gradient-to-r from-red-500 to-pink-500"
                className="w-full font-mono text-sm"
              />
              <p className="text-xs text-gray-500">You can use any valid Tailwind background classes to instantly theme the banner.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Banner Content (Rich Text / Links / Buttons)</label>
              <div className="border rounded-md overflow-hidden bg-white">
                <Editor
                  content={content}
                  onChange={setContent}
                  onSave={handleSave}
                  onCancel={() => {}}
                />
              </div>
            </div>

            <div className="flex justify-start pt-4 border-t dark:border-gray-700">
              <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 transition-transform hover:scale-105 cursor-pointer">
                {loading ? 'Saving Update...' : 'Save Banner Design'}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}