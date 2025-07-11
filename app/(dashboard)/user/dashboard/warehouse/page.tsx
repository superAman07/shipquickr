"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronRight,
  FileCheck,
  Home,
  Pencil,
  PlusIcon,
  Search,
  Trash2,
} from "lucide-react";
import AddWarehouseModal from "@/components/AddWarehouse";
import { toast } from "react-toastify";
import Link from "next/link";

interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  contactName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  isPrimary?: boolean;
  status?: boolean;
  mobile?: string;
  landmark?: string;
}

export default function WarehousesPage() {
  const title = "Warehouse List",
    subtitle = "Manage your warehouses";
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/user/warehouses");
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
      w.warehouseCode?.toLowerCase().includes(search.toLowerCase()) ||
      w.city?.toLowerCase().includes(search.toLowerCase()) ||
      w.state?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="dark:text-amber-50 rounded-2xl mt-10 sm:mt-0 bg-gradient-to-r from-white to-gray-50 px-2 py-2 shadow text-primary-foreground mb-4 md:mb-6 mx-2 md:mx-4">
        <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-800 dark:text-amber-50">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-xl sm:text-2xl dark:text-amber-50 font-bold tracking-tight">
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-800 dark:text-amber-50/90">
                  {subtitle}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1 min-w-0 text-xs sm:text-sm text-gray-800 dark:text-amber-50/80">
                <Link
                  href="/user/dashboard"
                  className="flex items-center text-gray-800 hover:text-gray-600 transition-colors min-w-0 shrink-0"
                >
                  <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  <span className="truncate">Dashboard</span>
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1" />
                <span className="font-medium truncate">Warehouse</span>
              </div>
            </div>
            <button
              type="button"
              className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
              onClick={() => setShowAddModal(true)}
            >
              <PlusIcon size={18} />
              <span>Add Warehouse</span>
            </button>
          </div>
        </div>
      </header>
      <div className="min-h-screen  dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center">
                  <label
                    htmlFor="entries-select"
                    className="text-sm text-gray-600 dark:text-gray-300 mr-2"
                  >
                    Show
                  </label>
                  <select
                    id="entries-select"
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={entries}
                    onChange={(e) => setEntries(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                    entries
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search
                      size={16}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full md:w-64 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    placeholder="Search warehouses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* --- MOBILE CARD LAYOUT --- */}
            <div className="block lg:hidden">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredWarehouses.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No matching records found.
                  </div>
                ) : (
                  filteredWarehouses.slice(0, entries).map((warehouse, index) => (
                    <div key={warehouse.id} className="bg-white dark:bg-gray-800 border border-none dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{warehouse.warehouseName}</div>
                          <div className="text-xs text-green-600 dark:text-green-400">{warehouse.warehouseCode}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-1 rounded"
                            title="Edit"
                            onClick={() => setEditWarehouse(warehouse)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded"
                            title="Delete"
                            onClick={() => {
                              try {
                                const response = confirm("Are you sure you want to delete this warehouse?");
                                if (response) {
                                  axios.delete(`/api/user/warehouses/${warehouse.id}`).then(() => {
                                    loadWarehouses();
                                  }).catch((error) => {
                                    console.error("Failed to delete warehouse:", error);
                                  });
                                }
                                toast.success("Warehouse deleted successfully");
                              } catch (e) {
                                toast.error("Failed to delete warehouse");
                              }
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                        <div>
                          <div className="font-medium text-gray-500 dark:text-gray-400">Contact Person</div>
                          <div className="text-gray-800 dark:text-gray-100">{warehouse.contactName}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500 dark:text-gray-400">Mobile</div>
                          <div className="text-gray-800 dark:text-gray-100">{warehouse.mobile || "-"}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium text-gray-500 dark:text-gray-400">Warehouse Details</div>
                          <div className="text-gray-800 dark:text-gray-100">
                            {warehouse.address1}
                            {warehouse.address2 ? `, ${warehouse.address2}` : ""}
                            , {warehouse.city}, {warehouse.state} - {warehouse.pincode}
                          </div>
                          {warehouse.landmark && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Landmark: {warehouse.landmark}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Primary</span>
                          <button
                            type="button"
                            disabled={warehouse.status === false || updatingId === warehouse.id}
                            onClick={async () => {
                              setUpdatingId(warehouse.id);
                              await axios.patch(
                                `/api/user/warehouses/${warehouse.id}`,
                                { isPrimary: !warehouse.isPrimary }
                              );
                              await loadWarehouses();
                              setUpdatingId(null);
                            }}
                            className={`w-10 h-6 flex cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ${warehouse.isPrimary ? "bg-blue-500" : "bg-gray-300"} ${warehouse.status === false ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Make Primary"
                          >
                            <span
                              className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${warehouse.isPrimary ? "translate-x-4" : ""}`}
                            ></span>
                          </button>
                        </div> 
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                          <button
                            type="button"
                            disabled={updatingId === warehouse.id}
                            onClick={async () => {
                              setUpdatingId(warehouse.id);
                              await axios.patch(
                                `/api/user/warehouses/${warehouse.id}`,
                                { status: !warehouse.status }
                              );
                              await loadWarehouses();
                              setUpdatingId(null);
                            }}
                            className={`w-10 h-6 flex items-center cursor-pointer rounded-full p-1 transition-colors duration-200 ${warehouse.status ? "bg-green-500" : "bg-gray-300"}`}
                            title="Active/Inactive"
                          >
                            <span
                              className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${warehouse.status ? "translate-x-4" : ""}`}
                            ></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="px-2 py-3 border-t bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  Showing {filteredWarehouses.length > 0 ? 1 : 0} to {Math.min(entries, filteredWarehouses.length)} of {filteredWarehouses.length} entries
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Warehouse Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Contact Person
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Warehouse Details
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Make Primary
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredWarehouses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredWarehouses
                        .slice(0, entries)
                        .map((warehouse, index) => (
                          <tr
                            key={warehouse.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                              <div>{warehouse.warehouseName}</div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {warehouse.warehouseCode}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {warehouse.contactName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {warehouse.address1}
                              {warehouse.address2
                                ? `, ${warehouse.address2}`
                                : ""}
                              ,{warehouse.city}, {warehouse.state} -{" "}
                              {warehouse.pincode}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                type="button"
                                disabled={
                                  warehouse.status === false ||
                                  updatingId === warehouse.id
                                }
                                onClick={async () => {
                                  setUpdatingId(warehouse.id);
                                  await axios.patch(
                                    `/api/user/warehouses/${warehouse.id}`,
                                    { isPrimary: !warehouse.isPrimary }
                                  );
                                  await loadWarehouses();
                                  setUpdatingId(null);
                                }}
                                className={`w-10 h-6 flex cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ${warehouse.isPrimary ? "bg-blue-500" : "bg-gray-300"} ${warehouse.status === false ? "opacity-50 cursor-not-allowed" : ""}`}
                                title="Make Primary"
                              >
                                <span
                                  className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${warehouse.isPrimary ? "translate-x-4" : ""}`}
                                ></span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                type="button"
                                disabled={updatingId === warehouse.id}
                                onClick={async () => {
                                  setUpdatingId(warehouse.id);
                                  await axios.patch(
                                    `/api/user/warehouses/${warehouse.id}`,
                                    { status: !warehouse.status }
                                  );
                                  await loadWarehouses();
                                  setUpdatingId(null);
                                }}
                                className={`w-10 h-6 flex items-center cursor-pointer rounded-full p-1 transition-colors duration-200 ${warehouse.status ? "bg-green-500" : "bg-gray-300"}`}
                                title="Active/Inactive"
                              >
                                <span
                                  className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${warehouse.status ? "translate-x-4" : ""}`}
                                ></span>
                              </button>
                            </td>
                            {/* Action */}
                            <td className="px-4 py-3 text-sm flex gap-2">
                              <button
                                type="button"
                                className="text-blue-500 cursor-pointer hover:text-blue-700 dark:hover:text-blue-400 p-1 rounded transition-colors"
                                title="Edit"
                                onClick={() => setEditWarehouse(warehouse)}
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                type="button"
                                className="text-red-500 cursor-pointer hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition-colors"
                                title="Delete"
                                onClick={() => {
                                  try {
                                    const response = confirm(
                                      "Are you sure you want to delete this warehouse?"
                                    );
                                    if (response) {
                                      axios
                                        .delete(
                                          `/api/user/warehouses/${warehouse.id}`
                                        )
                                        .then(() => {
                                          loadWarehouses();
                                        })
                                        .catch((error) => {
                                          console.error(
                                            "Failed to delete warehouse:",
                                            error
                                          );
                                        });
                                    }
                                    toast.success(
                                      "Warehouse deleted successfully"
                                    );
                                  } catch (e) {
                                    toast.error("Failed to delete warehouse");
                                  }
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {filteredWarehouses.length > 0 ? 1 : 0} to{" "}
                {Math.min(entries, filteredWarehouses.length)} of{" "}
                {filteredWarehouses.length} entries
              </div>
            </div> */}
          </div>
          <AddWarehouseModal
            open={showAddModal || !!editWarehouse}
            onClose={() => {
              setShowAddModal(false);
              setEditWarehouse(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setEditWarehouse(null);
              loadWarehouses();
            }}
            editData={
              editWarehouse
                ? {
                  id: editWarehouse.id,
                  warehouseName: editWarehouse.warehouseName || "",
                  pincode: editWarehouse.pincode || "",
                  address1: editWarehouse.address1 || "",
                  address2: editWarehouse.address2 || "",
                  landmark: editWarehouse.landmark || "",
                  state: editWarehouse.state || "",
                  city: editWarehouse.city || "",
                  contactName: editWarehouse.contactName || "",
                  mobile: editWarehouse.mobile || "",
                }
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
