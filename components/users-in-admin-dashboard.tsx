"use client"

import { useEffect, useState } from "react"
import type React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Mail, MoreVertical, Search } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { StatusToggle } from "./StatusToggleAdminsUserAction"
import { CourierAssignmentModal } from "./CourierAssignmentModal"
import { AdminWalletRechargeModal } from "./admin-wallet-recharge-modal"
import { BulkEmailModal } from "./bulk-email-modal"
import { AdminUserDetailsSheet } from "./admin-user-details-sheet"

type User = {
  id: string
  serialNo: number
  firstName: string
  lastName: string
  email: string
  status: boolean
  kycStatus: string
  kycDetail?: { updatedAt: string }
  wallet?: { balance: number }
  _count?: { orders: number }
  orders?: { createdAt: string }[]
}

export function UsersInAdminDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pageSize, setPageSize] = useState(10)

  const [selectedCourierUser, setSelectedCourierUser] = useState<User | null>(null)
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false)

  const [selectedRechargeUser, setSelectedRechargeUser] = useState<User | null>(null)
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false)

  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false)

  const [selectedUserDetailsId, setSelectedUserDetailsId] = useState<number | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)

  const [customFilter, setCustomFilter] = useState<
    "all" | "low_balance" | "no_orders_after_kyc" | "inactive"
  >("all")

  const [data, setData] = useState<User[]>([])

  useEffect(() => {
    axios
      .get("/api/admin/update-user-status")
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data)
        }
      })
      .catch((err) => console.log("Axios error:", err))
  }, [])

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
    },
    {
      accessorKey: "serialNo",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          S.No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const serialNo = row.index + 1
        return <div className="pl-4">{serialNo}</div>
      },
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span
          className="cursor-pointer font-medium text-indigo-600 hover:underline"
          onClick={() => {
            setSelectedUserDetailsId(Number(row.original.id))
            setIsDetailsSheetOpen(true)
          }}
        >
          {row.getValue("firstName")}
        </span>
      ),
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("lastName")}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "wallet",
      header: "Balance",
      cell: ({ row }) => {
        const bal = row.original.wallet?.balance || 0
        return (
          <div
            className={
              bal <= 200 ? "font-medium text-red-500" : "font-medium text-emerald-600"
            }
          >
            ₹{bal.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: "orders",
      header: "Shipments",
      cell: ({ row }) => {
        return <div>{row.original._count?.orders || 0}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <StatusToggle
            userId={row.original.id}
            initialStatus={row.original.status}
          />
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                Copy email
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setSelectedCourierUser(user)
                  setIsCourierModalOpen(true)
                }}
              >
                Manage Couriers
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setSelectedRechargeUser(user)
                  setIsRechargeModalOpen(true)
                }}
              >
                Manual Recharge
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={async () => {
                  if (
                    !confirm(
                      `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
                    )
                  ) {
                    return
                  }

                  try {
                    const res = await axios.delete("/api/admin/update-user-status", {
                      data: { userId: user.id },
                    })
                    toast.success(res.data.message)
                    setData((prev) => prev.filter((u) => u.id !== user.id))
                  } catch (e: any) {
                    toast.error("Delete error:", e)
                    alert("Failed to delete user. See console for details.")
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const totalBalance = data.reduce((sum, user) => sum + (user.wallet?.balance || 0), 0)
  const lowBalanceCount = data.filter((u) => (u.wallet?.balance || 0) <= 200).length

  const visibleRows = table.getRowModel().rows.filter((row) => {
    const user = row.original

    if (customFilter === "low_balance") {
      return (user.wallet?.balance || 0) <= 200
    }

    if (customFilter === "no_orders_after_kyc") {
      if (user.kycStatus === "approved" && user._count?.orders === 0 && user.kycDetail?.updatedAt) {
        const hoursSinceKyc =
          (new Date().getTime() - new Date(user.kycDetail.updatedAt).getTime()) /
          (1000 * 60 * 60)
        return hoursSinceKyc >= 24
      }
      return false
    }

    if (customFilter === "inactive") {
      if ((user._count?.orders || 0) > 0 && user.orders && user.orders.length > 0) {
        const daysSinceLastOrder =
          (new Date().getTime() - new Date(user.orders[0].createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        return daysSinceLastOrder >= 4
      }
      return false
    }

    return true
  })

  const selectedUsers = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  return (
    <div className="w-full space-y-4">
      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Total User Balances
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">₹{totalBalance.toFixed(2)}</h2>
        </div>

        <div
          onClick={() =>
            setCustomFilter(customFilter === "low_balance" ? "all" : "low_balance")
          }
          className={`cursor-pointer rounded-xl border bg-white p-5 text-center shadow-sm transition-all hover:ring-2 hover:ring-red-500 ${
            customFilter === "low_balance" ? "ring-2 ring-red-500 bg-red-50" : ""
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-red-600">
            Low Balance Users (≤ 200)
          </p>
          <h2 className="mt-2 text-3xl font-bold text-red-700">{lowBalanceCount} Users</h2>
          <p className="mt-1 text-xs text-muted-foreground">Click to filter</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-5 shadow-sm">
          <Label className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Advanced Filters
          </Label>
          <Select value={customFilter} onValueChange={(val: any) => setCustomFilter(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No active filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All Users</SelectItem>
              <SelectItem value="no_orders_after_kyc">No Orders &gt; 24h after KYC</SelectItem>
              <SelectItem value="inactive">Inactive &gt; 4 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col justify-between gap-3 py-2 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
        <div className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
          <span>Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              const nextPageSize = Number.parseInt(value)
              setPageSize(nextPageSize)
              table.setPageSize(nextPageSize)
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>

        <div className="flex w-full items-center gap-1 text-xs sm:w-auto sm:gap-2 sm:text-sm">
          <span>Search:</span>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
            <Input
              placeholder="Search..."
              value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("email")?.setFilterValue(event.target.value)
              }
              className="h-8 w-full pl-7 text-xs sm:w-[200px] sm:pl-8 sm:text-sm md:w-[300px]"
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <Button
            onClick={() => setIsBulkEmailModalOpen(true)}
            className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Bulk Email ({selectedUsers.length})
          </Button>
        )}
      </div>

      <div className="w-full max-w-full overflow-x-auto rounded-md border lg:overflow-x-visible">
        <Table className="min-w-max table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {visibleRows.length ? (
              visibleRows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-2 sm:px-4 sm:py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-xs sm:h-24 sm:text-sm"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col justify-between gap-3 py-2 sm:flex-row sm:items-center sm:gap-2 sm:py-4">
        <div className="text-xs text-muted-foreground sm:text-sm">
          Showing{" "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
        </div>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-2 text-xs sm:px-3"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-2 text-xs sm:px-3"
          >
            Next
          </Button>
        </div>
      </div>

      {selectedCourierUser && (
        <CourierAssignmentModal
          userId={parseInt(selectedCourierUser.id)}
          userName={`${selectedCourierUser.firstName} ${selectedCourierUser.lastName}`}
          isOpen={isCourierModalOpen}
          onClose={() => setIsCourierModalOpen(false)}
        />
      )}

      {selectedRechargeUser && (
        <AdminWalletRechargeModal
          userId={parseInt(selectedRechargeUser.id)}
          userName={`${selectedRechargeUser.firstName} ${selectedRechargeUser.lastName}`}
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={() => {
            // Optional: you could refresh data here if you displayed balances in the table
          }}
        />
      )}

      <BulkEmailModal
        isOpen={isBulkEmailModalOpen}
        onClose={() => setIsBulkEmailModalOpen(false)}
        selectedUsers={selectedUsers}
        onSuccess={() => setRowSelection({})}
      />

      <AdminUserDetailsSheet
        userId={selectedUserDetailsId}
        isOpen={isDetailsSheetOpen}
        onClose={() => setIsDetailsSheetOpen(false)}
      />
    </div>
  )
}