          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto min-h-[calc(100vh-300px)]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#0a0c37] text-white">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 w-[140px] text-center">AWB Number</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 w-[140px] text-center shrink-0">Label</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300">Order ID & Date</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300">Customer Details</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 text-center">Payment</th>
                  {activeTab === 'cancelled' && <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 text-center">Refund Status</th>}
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 text-center">Courier</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#111827]">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} onClick={() => openDrawer(order)} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer relative">
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300">{order.awbNumber || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {labelStatuses.includes(order.status) && order.awbNumber && (
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadLabel(order) }} disabled={downloadingLabelId === order.id} className="inline-flex items-center justify-center p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900 cursor-pointer disabled:opacity-50 group-hover:shadow-sm" title="Download Label"><Download className={`h-4 w-4 ${downloadingLabelId === order.id ? 'animate-spin' : ''}`} /></button>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{order.orderId}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{order.customerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.mobile}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{order.paymentMode}</div>
                      {order.items && order.items.length > 0 && <div className="text-xs text-gray-500">{"\u20B9"}{order.items.reduce((sum, item) => sum + item.orderValue, 0)}</div>}
                    </td>
                    {activeTab === 'cancelled' && (
                      <td className="py-4 px-4 text-center"><RefundBadge order={order} /></td>
                    )}
                    <td className="py-4 px-4 text-center">
                      <SBadge status={order.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{order.courierName || '-'}</div>
                      {refreshStatuses.includes(order.status) && order.awbNumber && <button onClick={(e) => { e.stopPropagation(); handleRefreshStatus(order) }} disabled={refreshingId === order.id} className="mt-1 flex items-center justify-center gap-1 mx-auto text-[10px] uppercase font-bold tracking-wider text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer transition-colors"><RefreshCw className={`h-3 w-3 ${refreshingId === order.id ? 'animate-spin' : ''}`} /> Refresh</button>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex justify-center -space-x-px rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 mx-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleCloneOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-10 rounded-l-xl cursor-pointer" title="Clone"><Copy className="h-4 w-4" /></button>
                        {order.status === 'unshipped' && <button onClick={() => handleShipOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 focus:z-10 cursor-pointer" title="Ship"><Truck className="h-4 w-4" /></button>}
                        {shippedStatuses.includes(order.status) && <button onClick={() => handleCancelOrder(order.id)} className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:z-10 cursor-pointer" title="Cancel"><XCircle className="h-4 w-4" /></button>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="relative inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-10 rounded-r-xl cursor-pointer"><span className="sr-only">More</span><MoreHorizontal className="h-4 w-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 z-[80]">
                            <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="text-red-600 dark:text-red-400 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20 cursor-pointer rounded-lg"><Trash2 className="h-4 w-4 mr-2" /> Delete Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Package className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600 mx-auto" />
                      <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-1">No orders found</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Try creating a new order or adjusting your search.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-700 dark:text-gray-300">{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> {"\u2013"} <span className="font-bold text-gray-700 dark:text-gray-300">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{filteredOrders.length}</span> orders
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer">Previous</button>
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white min-w-[60px] text-center">{currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors cursor-pointer">Next</button>
          </div>
        </div>
      </div>

      <OrderDetailDrawer order={drawerOrder} isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); setDrawerOrder(null) }} onClone={handleCloneOrder} onDelete={handleDeleteOrder} onShip={handleShipOrder} onCancel={handleCancelOrder} onRefreshStatus={handleRefreshStatus} onDownloadLabel={handleDownloadLabel} refreshingId={refreshingId} downloadingLabelId={downloadingLabelId} />
    </div>
  )
}

export default UnifiedOrdersPage;
