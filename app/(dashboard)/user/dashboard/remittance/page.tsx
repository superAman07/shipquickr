'use client'
import React, { useState } from 'react';
import { Download, Search, Calendar, Package, Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import Link from 'next/link';

const RemittancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'remittance' | 'netoff'>('remittance');

  // Placeholder data and functions for now
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(''); // Placeholder for date range input

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const downloadCSV = () => {
    // Placeholder for CSV download logic
    console.log('Downloading CSV for:', activeTab);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Remittance</span>
          </div>

          <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Remittance</h1>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('remittance')}
                className={cn(
                  'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'remittance'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Remittance
              </button>
              <button
                onClick={() => setActiveTab('netoff')}
                className={cn(
                  'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'netoff'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Net Off
              </button>
            </nav>
          </div>

          {/* Filters and Actions */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Picker Placeholder */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="MM/DD/YYYY - MM/DD/YYYY"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by AWB, UTR/Reference No."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            {/* Download Button */}
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

          {/* Content Area */}
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">
            {activeTab === 'remittance' && (
              <div>
                {/* Remittance Summary Cards Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="text-sm font-medium mb-1">Total COD</div>
                    <div className="text-2xl font-bold">₹0.00</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <div className="text-sm font-medium mb-1">COD Available</div>
                    <div className="text-2xl font-bold">₹0.00</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500 to-lime-500 text-white">
                    <div className="text-sm font-medium mb-1">Deduction</div>
                    <div className="text-2xl font-bold">₹0.00</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <div className="text-sm font-medium mb-1">COD Paid</div>
                    <div className="text-2xl font-bold">₹0.00</div>
                  </div>
                </div>

                {/* Remittance Table Placeholder */}
                <div className="overflow-x-auto p-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">S.No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remittance Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">UTR/Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collectable Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Off</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Early COD</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">COD Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deduction</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remark</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {/* Placeholder Row */}
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          No data available in table
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'netoff' && (
              <div>
                {/* Net Off Table Placeholder */}
                <div className="overflow-x-auto p-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">S.No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Off Settlement Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">UTR/Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collectable Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Off</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Early COD</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">COD Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Download</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {/* Placeholder Row */}
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          No data available in table
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Placeholder */}
            <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Showing 0 to 0 of 0 entries
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RemittancePage;