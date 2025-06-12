'use client';

import { useState, useRef } from 'react';
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
  Bold,
  Italic,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Image,
  Quote,
  Table as TableIcon,
  Undo,
  Redo,
  Play,
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

interface NewsItem {
  id: number;
  description: string;
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

  const [newsItems, setNewsItems] = useState<NewsItem[]>([
    {
      id: 1,
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      status: false
    },
    {
      id: 2,
      description: `• Lorem Ipsum is simply dummy text of the printing and typesetting industry.
• Lorem Ipsum is simply dummy text of the printing and typesetting industry.
• Lorem Ipsum is simply dummy text of the printing and typesetting industry.
• Lorem Ipsum is simply dummy text of the printing and typesetting industry.
• Lorem Ipsum is simply dummy text of the printing and typesetting industry.
• Lorem Ipsum is simply dummy text of the printing and typesetting industry.`,
      status: true
    }
  ]);

  const toggleStatus = (id: number) => {
    setNewsItems(items =>
      items.map(item =>
        item.id === id ? { ...item, status: !item.status } : item
      )
    );
  };

  const filteredItems = newsItems.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handleSaveNews = () => {
    if (newsDescription.trim()) {
      if (currentView === 'edit' && editingItem) {
        setNewsItems(items =>
          items.map(item =>
            item.id === editingItem.id
              ? { ...item, description: newsDescription }
              : item
          )
        );
      } else {
        const newItem: NewsItem = {
          id: Math.max(...newsItems.map(item => item.id)) + 1,
          description: newsDescription,
          status: false
        };
        setNewsItems([...newsItems, newItem]);
      }
      setNewsDescription('');
      setEditingItem(null);
      setCurrentView('list');
    }
  };

  const handleEditItem = (item: NewsItem) => {
    setEditingItem(item);
    setNewsDescription(item.description);
    setCurrentView('edit');
  };

  const handleCancel = () => {
    setNewsDescription('');
    setEditingItem(null);
    setCurrentView('list');
  };

  // Rich text editor functions
  const insertTextAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = newsDescription;

    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    setNewsDescription(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const wrapSelectedText = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newsDescription.substring(start, end);
    const currentText = newsDescription;

    if (selectedText) {
      const newText = currentText.substring(0, start) + prefix + selectedText + suffix + currentText.substring(end);
      setNewsDescription(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      insertTextAtCursor(prefix + suffix);
    }
  };

  const handleBold = () => wrapSelectedText('**', '**');
  const handleItalic = () => wrapSelectedText('*', '*');
  const handleLink = () => wrapSelectedText('[', '](url)');
  const handleBulletList = () => insertTextAtCursor('\n• ');
  const handleNumberedList = () => insertTextAtCursor('\n1. ');
  const handleQuote = () => insertTextAtCursor('\n> ');
  const handleImage = () => insertTextAtCursor('![alt text](image-url)');

  const handleInsertTable = (rows: number, cols: number) => {
    let table = '\n\n';

    // Header row
    table += '|';
    for (let i = 0; i < cols; i++) {
      table += ` Header ${i + 1} |`;
    }
    table += '\n';

    // Separator row
    table += '|';
    for (let i = 0; i < cols; i++) {
      table += ' --- |';
    }
    table += '\n';

    // Data rows
    for (let i = 0; i < rows - 1; i++) {
      table += '|';
      for (let j = 0; j < cols; j++) {
        table += ` Cell ${i + 1}-${j + 1} |`;
      }
      table += '\n';
    }

    insertTextAtCursor(table);
  };

  const TableSizeSelector = ({ onSelect }: { onSelect: (rows: number, cols: number) => void }) => {
    const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });

    return (
      <div className="p-2 bg-white dark:bg-gray-800 border rounded-md shadow-lg">
        <div className="grid grid-cols-10 gap-1 mb-2">
          {Array.from({ length: 100 }, (_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const isHighlighted = row <= hoveredCell.row && col <= hoveredCell.col;

            return (
              <div
                key={i}
                className={`w-4 h-4 border cursor-pointer ${isHighlighted
                    ? 'bg-blue-500 border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}
                onMouseEnter={() => setHoveredCell({ row, col })}
                onClick={() => onSelect(row + 1, col + 1)}
              />
            );
          })}
        </div>
        <div className="text-xs text-center text-gray-600 dark:text-gray-400">
          {hoveredCell.row + 1} × {hoveredCell.col + 1}
        </div>
      </div>
    );
  };

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
      <Editor/>
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
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(item.id)}
                          className="p-0 h-auto hover:bg-transparent"
                        >
                          {item.status ? (
                            <ToggleRight className="h-6 w-6 text-blue-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
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
                            <DropdownMenuItem>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
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