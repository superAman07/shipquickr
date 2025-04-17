"use client"

import { useState } from "react"
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
import { ArrowUpDown, MoreVertical, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateKycStatus } from "@/app/actions/kyc-actions"
import { Toaster } from "@/components/ui/sonner"

// Define the User type
type User = {
  id: string
  serialNo: number
  firstName: string
  lastName: string
  email: string
  status: "Pending" | "Approved" | "Rejected"
}

// Sample data - replace with actual data from your database
const data: User[] = [
  {
    id: "1",
    serialNo: 1,
    firstName: "jkHXaXYHxwmt",
    lastName: "eHDxdEMJNE",
    email: "digbinicholsf48@gmail.com",
    status: "Pending",
  },
  {
    id: "2",
    serialNo: 2,
    firstName: "QeThxkBM",
    lastName: "kmZXHQLawivIAwd",
    email: "hobargiumy1970@yahoo.com",
    status: "Pending",
  },
  {
    id: "3",
    serialNo: 3,
    firstName: "gatyPkhVALylkQD",
    lastName: "qYrSRcuY",
    email: "ilanahuffmangh6@gmail.com",
    status: "Pending",
  },
  {
    id: "4",
    serialNo: 4,
    firstName: "RMBazoiEauTfN",
    lastName: "TXHTaXbHZrrTXdd",
    email: "ylaney1983@gmail.com",
    status: "Pending",
  },
  {
    id: "5",
    serialNo: 5,
    firstName: "Aman",
    lastName: "vishwakarma",
    email: "amanvishwa2806@gmail.com",
    status: "Approved",
  },
  {
    id: "6",
    serialNo: 6,
    firstName: "john",
    lastName: "smith",
    email: "xojim92940@clubemp.com",
    status: "Pending",
  },
  {
    id: "7",
    serialNo: 7,
    firstName: "TbzoeERFOMr",
    lastName: "iAgVj0lJvHCUtIE",
    email: "mack.jenny274994@yahoo.com",
    status: "Pending",
  },
  {
    id: "8",
    serialNo: 8,
    firstName: "eKTkmfgBWfc",
    lastName: "nOtEIXNcExQBL",
    email: "hamishvcp40@gmail.com",
    status: "Pending",
  },
]

export function KycDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Define columns for the table
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "serialNo",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            S.No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="pl-4">{row.getValue("serialNo")}</div>,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("firstName")}</div>,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Last Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("lastName")}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original

        const handleStatusChange = async (value: string) => {
          setIsUpdating(user.id)
          try {
            // Call server action to update status
            await updateKycStatus({
              userId: user.id,
              status: value as "Pending" | "Approved" | "Rejected",
            })
          } catch (error) {
            
          } finally {
            setIsUpdating(null)
          }
        }

        return (
          <Select defaultValue={user.status} onValueChange={handleStatusChange} disabled={isUpdating === user.id}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>Copy email</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/admin/kyc/${user.id}`, "_blank")}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/admin/kyc/${user.id}/documents`, "_blank")}>
                View documents
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

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row items-center py-4 gap-4 justify-between">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number.parseInt(value))
              table.setPageSize(Number.parseInt(value))
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span>Search:</span>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
              className="pl-8 w-full md:w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
