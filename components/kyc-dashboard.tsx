"use client"

import { useEffect, useState } from "react"
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
import axios from "axios"
import { toast } from "react-toastify" 
import { useRouter } from "next/navigation"
 
type User = {
  id: string
  serialNo: number
  firstName: string
  lastName: string
  email: string
  kycStatus: string  
}
 
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function KycDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const [data, setData] = useState<User[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/admin/kyc")
        if (res.data.success) { 
          const formattedData = res.data.data.map((user: any) => ({
            ...user,
            id: user.id.toString(),  
          }));
          setData(formattedData)
        }
      } catch (err:any) {
        toast.error("Failed to fetch KYC data")
        console.error("Axios error:", err)
      }
    }

    fetchData()
  }, []);
 
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
      cell: ({ row }) => {
        const serialNo = row.index + 1; 
        return <div className="pl-4">{serialNo}</div>
      },
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
      accessorKey: "kycStatus",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original
         
        const originalStatus = user.kycStatus;
         
        const capitalizedStatus = capitalizeFirstLetter(originalStatus);
        
        const handleStatusChange = async (userId: string, newStatus: string) => {
          setIsUpdating(userId)
          try { 
            const backendStatus = newStatus.toLowerCase();
            
            await axios.post('/api/admin/kyc',{ userId, status: backendStatus }) 
            toast.success("KYC Status updated successfully");
            setData((prevData) =>
              prevData.map((item) =>
                item.id === userId ? { ...item, kycStatus: backendStatus } : item
              )
            ) 
          } catch(err) {
            toast.error("Could not update KYC status");
            console.error("Status update failed:", err);
          } finally {
            setIsUpdating(null)
          }
        }

        return (
          <Select 
            value={capitalizedStatus}  
            onValueChange={(v) => handleStatusChange(user.id, v)}
            disabled={isUpdating === user.id}
          >
            <SelectTrigger className="w-[130px]">
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
              <DropdownMenuItem onClick={() => window.open(`/admin/dashboard/kyc/${user.id}`, "_blank")}>
                View details
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => window.open(`/admin/kyc/${user.id}/documents`, "_blank")}>
                View documents
              </DropdownMenuItem> */}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center py-2 sm:py-4 gap-3 sm:gap-4 justify-between">
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
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

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm">
          <span>Search:</span>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
              className="pl-7 sm:pl-8 h-8 text-xs sm:text-sm w-full sm:w-[200px] md:w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border w-full max-w-full overflow-x-auto lg:overflow-x-visible">
        <Table className="min-w-max table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
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
                    <TableCell key={cell.id} className="px-2 py-2 sm:px-4 sm:py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 sm:h-24 text-center text-xs sm:text-sm">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 py-2 sm:py-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs h-8 px-2 sm:px-3"
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="text-xs h-8 px-2 sm:px-3">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}