'use client'
import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Home,
  Package,
  Search as SearchIcon,
  Copy,
  Truck, 
  XCircle,  
  Eye,  
  Plus, 
  ListFilter, 
} from "lucide-react";

interface Coupon {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  limit: string;
  condition: string;
  amount: string;
  schedule: string;
  status: boolean;
}

interface FormData {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  limit: string;
  condition: string;
  amount: string;
  schedule: string;
}

function App() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    limit: '',
    condition: '',
    amount: '',
    schedule: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      limit: '',
      condition: '',
      amount: '',
      schedule: ''
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing coupon
      setCoupons(prev => prev.map(coupon => 
        coupon.id === editingId 
          ? { ...coupon, ...formData }
          : coupon
      ));
    } else {
      // Add new coupon
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        ...formData,
        status: true
      };
      setCoupons(prev => [...prev, newCoupon]);
    }
    
    resetForm();
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      name: coupon.name,
      code: coupon.code,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      limit: coupon.limit,
      condition: coupon.condition,
      amount: coupon.amount,
      schedule: coupon.schedule
    });
    setEditingId(coupon.id);
  };

  const handleDelete = (id: string) => {
    setCoupons(prev => prev.filter(coupon => coupon.id !== id));
  };

  const toggleStatus = (id: string) => {
    setCoupons(prev => prev.map(coupon => 
      coupon.id === id ? { ...coupon, status: !coupon.status } : coupon
    ));
  };

  // Filter and paginate coupons
  const filteredCoupons = coupons.filter(coupon =>
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * showEntries;
  const endIndex = startIndex + showEntries;
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredCoupons.length / showEntries);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <header className="dark:text-amber-50 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-900 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 dark:text-amber-50">
                {/* <ListFilter className="h-5 w-5 sm:h-6 sm:w-6" /> */}
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  Coupon
                </h1>
              </div>
            </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-primary-foreground/70 dark:text-amber-50/80">
                <Link href="/admin/dashboard" className="flex items-center hover:text-gray-300">
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />Dashboard
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium">Coupon</span>
              </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        {/* Coupon Form */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-6 mb-8 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Coupon Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Coupon Name"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Coupon Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Coupon Code"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Coupon Limit
                </label>
                <input
                  type="text"
                  name="limit"
                  value={formData.limit}
                  onChange={handleInputChange}
                  placeholder="Coupon Limit"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Coupon Condition
                </label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  placeholder="Coupon Condition"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Amount"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Coupon Schedule
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              >
                {editingId ? 'Update Coupon' : 'Submit Coupon'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ml-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-3 px-8 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-6 transition-colors duration-300">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Coupon List
          </h2>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show
              </span>
              <select
                value={showEntries}
                onChange={(e) => setShowEntries(Number(e.target.value))}
                className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                entries
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Search:
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                placeholder="Search coupons..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Coupon Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Coupon Code</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Start Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">End Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Coupon Limit</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Coupon Condition</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Schedule</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paginatedCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-200 dark:border-gray-700 duration-200">
                      <td className="py-3 px-2">{coupon.name}</td>
                      <td className="py-3 px-2">{coupon.code}</td>
                      <td className="py-3 px-2">{coupon.amount}</td>
                      <td className="py-3 px-2">{coupon.startDate}</td>
                      <td className="py-3 px-2">{coupon.endDate}</td>
                      <td className="py-3 px-2">{coupon.limit}</td>
                      <td className="py-3 px-2">{coupon.condition}</td>
                      <td className="py-3 px-2">{coupon.schedule}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => toggleStatus(coupon.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
                            coupon.status ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                              coupon.status ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {filteredCoupons.length === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(endIndex, filteredCoupons.length)} of {filteredCoupons.length} entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-md transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded-md transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1 border rounded-md transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;