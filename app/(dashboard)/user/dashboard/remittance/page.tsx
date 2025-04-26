'use client'
import React, { useState, useEffect } from 'react';
import { Download, Search, Calendar, Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import axios from 'axios';
import Loading from '@/app/loading';

const PAGE_SIZE = 10;

const RemittancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'remittance' | 'netoff'>('remittance');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [remittances, setRemittances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {
          tab: activeTab,
          search: searchTerm,
          daterange: dateRange,
          page,
          pageSize: PAGE_SIZE,
        };
        const res = await axios.get('/api/user/remittance', { params });
        setRemittances(res.data.remittances || []);
        setSummary(res.data.summary || {});
        setTotal(res.data.total || 0);
      } catch (err) {
        setRemittances([]);
        setSummary({});
        setTotal(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, searchTerm, dateRange, page]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(event.target.value);
    setPage(1);
  };

  const handleTabChange = (tab: 'remittance' | 'netoff') => {
    setActiveTab(tab);
    setPage(1);
  };

  const downloadCSV = () => { 
    const csvContent = `data:text/csv;charset=utf-8,${remittances.map((rem) => [
      rem.remittanceDate,
      rem.utrReference,
      rem.collectableValue,
      rem.netOffAmount,
      rem.earlyCodCharge,
      rem.codPaid,
      rem.remarks,
    ].join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'remittance_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
 
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#10162A] dark:text-gray-100">
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/user/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Remittance</span>
          </div>

          <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Remittance</h1>
 
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                type='button'
                onClick={() => handleTabChange('remittance')}
                className={cn(
                  'whitespace-nowrap cursor-pointer py-3 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'remittance'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Remittance
              </button>
              <button
                type='button'
                onClick={() => handleTabChange('netoff')}
                className={cn(
                  'whitespace-nowrap cursor-pointer py-3 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'netoff'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                )}
              >
                Net Off
              </button>
            </nav>
          </div>
 
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="MM/DD/YYYY - MM/DD/YYYY"
                  value={dateRange}
                  onChange={handleDateChange}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div> 
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
 
          <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">
            {activeTab === 'remittance' && (
              <div> 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="text-sm font-medium mb-1">Total COD</div>
                    <div className="text-2xl font-bold">
                      ₹{summary ? (summary.totalCOD || 0).toFixed(2) : "0.00"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <div className="text-sm font-medium mb-1">COD Available</div>
                    <div className="text-2xl font-bold">
                      ₹{summary ? (summary.codAvailable || 0).toFixed(2) : "0.00"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500 to-lime-500 text-white">
                    <div className="text-sm font-medium mb-1">Deduction</div>
                    <div className="text-2xl font-bold">
                      ₹{summary ? (summary.deduction || 0).toFixed(2) : "0.00"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <div className="text-sm font-medium mb-1">COD Paid</div>
                    <div className="text-2xl font-bold">
                      ₹{summary ? (summary.codPaid || 0).toFixed(2) : "0.00"}
                    </div>
                  </div>
                </div>
 
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
                      {loading ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            <Loading/>
                          </td>
                        </tr>
                      ) : remittances.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        remittances.map((rem, idx) => (
                          <tr key={rem.id}>
                            <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                            <td className="px-4 py-3">{new Date(rem.remittanceDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{rem.utrReference || "-"}</td>
                            <td className="px-4 py-3">₹{rem.collectableValue.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.netOffAmount.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.earlyCodCharge.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.codPaid.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{(rem.netOffAmount + rem.earlyCodCharge + (rem.otherDeductions || 0)).toFixed(2)}</td>
                            <td className="px-4 py-3">{rem.remarks || "-"}</td>
                            <td className="px-4 py-3"> 
                              <button type='button' className="text-blue-600 cursor-pointer hover:underline text-xs">Download</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'netoff' && (
              <div> 
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
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            <Loading/>
                          </td>
                        </tr>
                      ) : remittances.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        remittances.map((rem, idx) => (
                          <tr key={rem.id}>
                            <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                            <td className="px-4 py-3">{new Date(rem.remittanceDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{rem.utrReference || "-"}</td>
                            <td className="px-4 py-3">₹{rem.collectableValue.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.netOffAmount.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.earlyCodCharge.toFixed(2)}</td>
                            <td className="px-4 py-3">₹{rem.codPaid.toFixed(2)}</td>
                            <td className="px-4 py-3">{rem.remarks || "-"}</td>
                            <td className="px-4 py-3">
                              <button className="text-blue-600 hover:underline text-xs">Download</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
 
            <div className="px-6 py-4 flex items-center justify-between border-t bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} entries
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 cursor-pointer rounded-md shadow border-gray-300 bg-white text-gray-700 text-sm hover:bg-opacity-80 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  disabled={page === totalPages || totalPages === 0}
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