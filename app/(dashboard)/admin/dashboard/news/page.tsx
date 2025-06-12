'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Table as TableIcon,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Eye,
  Home,
  Link2
} from 'lucide-react';
import Link from 'next/link';
import Editor from '@/components/Editor/Editor';
import { toast } from 'react-toastify';
import axios from 'axios';

interface NewsItem {
  id: number;
  description: any;
  status: boolean;
}

export default function NewsManagement() {
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [newsDescription, setNewsDescription] = useState('');
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  // Function to fetch news
  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/news');
      setNewsItems(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await axios.patch('/api/admin/news', { id });
      fetchNews(); // Refresh the news list
      toast.success("News status updated");
    } catch (error) {
      console.error("Error updating news status:", error);
      toast.error("Failed to update news status");
    }
  };

  const handleSaveNews = async () => {
    try {
      if (currentView === 'add') {
        await axios.post('/api/admin/news', {
          description: newsDescription,
          status: true
        });
        toast.success("News created successfully");
      } else {
        await axios.put('/api/admin/news', {
          id: editingItem?.id,
          description: newsDescription,
          status: editingItem?.status
        });
        toast.success("News updated successfully");
      }
      setCurrentView('list');
      fetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
      toast.error("Failed to save news");
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm("Are you sure you want to delete this news?")) return;

    try {
      await axios.delete('/api/admin/news', { data: { id } });
      fetchNews(); // Refresh the news list
      toast.success("News deleted successfully");
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Failed to delete news");
    }
  };

  const filteredItems = newsItems.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handleEditItem = (item: NewsItem) => {
    setEditingItem(item);
    setNewsDescription(item.description);
    setCurrentView('edit');
  };

  useEffect(() => {
    if (currentView === 'add') {
      setNewsDescription('');
      setEditingItem(null);
    }
  }, [currentView]);

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
          <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 dark:text-amber-50">
                  <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                    {currentView === 'add' ? 'Add News' : 'Edit News'}
                  </h1>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />Dashboard
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <button
                  onClick={() => setCurrentView('list')}
                  className="hover:text-blue-300 cursor-pointer transition-colors"
                >
                  News
                </button>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="text-gray-300">
                  {currentView === 'add' ? 'Add News' : 'Edit News'}
                </span>
              </div>
            </div>
          </div>
        </header>
        <Editor
          content={newsDescription}
          onChange={setNewsDescription}
          onSave={handleSaveNews}
          onCancel={() => setCurrentView('list')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 dark:text-amber-50">
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  News
                </h1>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
              <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300">
                <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
              <span className="font-medium">News</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-md font-medium text-gray-800 dark:text-gray-200">News</CardTitle>
            <Button
              onClick={() => setCurrentView('add')}
              className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add News
            </Button>
          </CardHeader>

          <CardContent>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Search:</span>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder=""
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-3 pr-10 w-48"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>News Description</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-20 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="text-center font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div
                          className="rich-content text-gray-700 dark:text-gray-300 prose prose-sm max-h-15 overflow-hidden hover:overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: item.description }}
                          style={{
                            listStyleType: 'disc',
                            listStylePosition: 'inside'
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(item.id)}
                          className="p-0 h-auto w-auto hover:bg-transparent"
                        >
                          {item.status ? (
                            <ToggleRight
                              className="h-14 w-14 text-blue-500"
                              style={{ minWidth: '1.5rem', minHeight: '1.5rem' }}
                            />
                          ) : (
                            <ToggleLeft className="h-14 w-14 text-gray-400" style={{ minWidth: '1.5rem', minHeight: '1.5rem' }} />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteNews(item.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} entries
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}