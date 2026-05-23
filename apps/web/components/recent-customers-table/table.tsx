"use client";
"use no memo";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Loader2,
  Search,
  Trash2,
  UsersRound,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { n8n } from "@/lib/n8n-webhook-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { recentCustomersColumns } from "./columns";
import type { RecentCustomerRow } from "./schema";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "Subscribed", label: "Subscribed" },
  { value: "Inactive", label: "Inactive" },
  { value: "Unsubscribed", label: "Unsubscribed" },
] as const;

const billingOptions = [
  { value: "all", label: "All" },
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Overdue", label: "Overdue" },
  { value: "Trial", label: "Trial" },
] as const;

const joinedDateOptions = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
] as const;

const bulkStatusOptions = [
  { value: "Subscribed", label: "Subscribed", icon: CheckCircle, color: "text-green-600" },
  { value: "Inactive", label: "Inactive", icon: AlertCircle, color: "text-yellow-600" },
  { value: "Unsubscribed", label: "Unsubscribed", icon: XCircle, color: "text-red-600" },
] as const;

const bulkBillingOptions = [
  { value: "Paid", label: "Paid", color: "bg-green-100 text-green-700" },
  { value: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "Overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
  { value: "Trial", label: "Trial", color: "bg-blue-100 text-blue-700" },
] as const;

interface RecentCustomersTableProps {
  initialData?: RecentCustomerRow[];
  initialTotal?: number;
}

export function RecentCustomersTable({ initialData = [], initialTotal = 0 }: RecentCustomersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<RecentCustomerRow[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(!initialData.length);
  const [rowSelection, setRowSelection] = useState({});
  
  // Bulk action states
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<string>("");

  // Get filters from URL
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentBilling = searchParams.get("billing") || "all";
  const currentJoinedDate = searchParams.get("joinedDate") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentPageSize = Number(searchParams.get("pageSize")) || 10;
  
  // Parse sort from URL
  const getSortFromURL = (): SortingState => {
    const sort = searchParams.get("sort");
    if (sort === "oldest") return [{ id: "joined", desc: false }];
    if (sort === "name-asc") return [{ id: "name", desc: false }];
    if (sort === "name-desc") return [{ id: "name", desc: true }];
    return [{ id: "joined", desc: true }]; // newest default
  };

  const [sorting, setSorting] = useState<SortingState>(getSortFromURL);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize: currentPageSize,
  });

  // Get selected row IDs
  const getSelectedRowIds = useCallback(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    return selectedRows.map(row => row.original.id);
  }, [rowSelection]);

  // Bulk delete customers
  const handleBulkDelete = async () => {
    const selectedIds = getSelectedRowIds();
    if (selectedIds.length === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await n8nService.bulkDelete("deleteCustomers", selectedIds);
      
      if (response.success) {
        toast.success(`Successfully deleted ${selectedIds.length} customer(s)`);
        setRowSelection({});
        setDeleteDialogOpen(false);
        fetchCustomers(); // Refresh the table
      } else {
        throw new Error(response.error || "Failed to delete customers");
      }
    } catch (error) {
      console.error("Error deleting customers:", error);
      toast.error("Failed to delete customers. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk update status
  const handleBulkUpdateStatus = async () => {
    const selectedIds = getSelectedRowIds();
    if (selectedIds.length === 0 || !selectedStatus) return;

    setBulkActionLoading(true);
    try {
      const response = await n8nService.bulkUpdate("updateCustomersStatus", {
        customerIds: selectedIds,
        status: selectedStatus,
      });
      
      if (response.success) {
        toast.success(`Successfully updated ${selectedIds.length} customer(s) to ${selectedStatus}`);
        setRowSelection({});
        setStatusDialogOpen(false);
        setSelectedStatus("");
        fetchCustomers(); // Refresh the table
      } else {
        throw new Error(response.error || "Failed to update customer status");
      }
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast.error("Failed to update customer status. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk update billing
  const handleBulkUpdateBilling = async () => {
    const selectedIds = getSelectedRowIds();
    if (selectedIds.length === 0 || !selectedBilling) return;

    setBulkActionLoading(true);
    try {
      const response = await n8nService.bulkUpdate("updateCustomersBilling", {
        customerIds: selectedIds,
        billingStatus: selectedBilling,
      });
      
      if (response.success) {
        toast.success(`Successfully updated ${selectedIds.length} customer(s) billing to ${selectedBilling}`);
        setRowSelection({});
        setBillingDialogOpen(false);
        setSelectedBilling("");
        fetchCustomers(); // Refresh the table
      } else {
        throw new Error(response.error || "Failed to update customer billing");
      }
    } catch (error) {
      console.error("Error updating customer billing:", error);
      toast.error("Failed to update customer billing. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Update URL with current filters
  const updateUrlParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === 0) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Fetch data from n8n
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    
    try {
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      };

      if (currentSearch) params.search = currentSearch;
      if (currentStatus !== "all") params.status = currentStatus;
      if (currentBilling !== "all") params.billing = currentBilling;
      if (currentJoinedDate !== "all") params.daysBack = currentJoinedDate;
      
      if (sorting[0]) {
        params.sortBy = sorting[0].id;
        params.sortOrder = sorting[0].desc ? "desc" : "asc";
      }

      const response = await n8nService.getPaginated<RecentCustomerRow>("getCustomers", params.page, params.pageSize, {
        search: params.search,
        status: params.status,
        billing: params.billing,
        daysBack: params.daysBack,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      if (response.success && response.data) {
        setData(response.data.data);
        setTotal(response.data.total);
        
        if (response.data.page !== pagination.pageIndex + 1) {
          setPagination(prev => ({ ...prev, pageIndex: response.data.page - 1 }));
        }
      } else {
        throw new Error(response.error || "Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, currentSearch, currentStatus, currentBilling, currentJoinedDate, sorting]);

  // Sync URL with state
  useEffect(() => {
    const params: Record<string, string | number | null> = {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: currentSearch || null,
      status: currentStatus !== "all" ? currentStatus : null,
      billing: currentBilling !== "all" ? currentBilling : null,
      joinedDate: currentJoinedDate !== "all" ? currentJoinedDate : null,
    };
    
    const sortValue = getSortValueFromState(sorting);
    if (sortValue !== "newest") {
      params.sort = sortValue;
    }
    
    updateUrlParams(params);
  }, [pagination, currentSearch, currentStatus, currentBilling, currentJoinedDate, sorting]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Helper to get sort value from sorting state
  function getSortValueFromState(sortingState: SortingState): string {
    if (!sortingState[0]) return "newest";
    if (sortingState[0].id === "joined" && sortingState[0].desc) return "newest";
    if (sortingState[0].id === "joined" && !sortingState[0].desc) return "oldest";
    if (sortingState[0].id === "name" && !sortingState[0].desc) return "name-asc";
    if (sortingState[0].id === "name" && sortingState[0].desc) return "name-desc";
    return "newest";
  }

  // Table setup
  const table = useReactTable({
    data,
    columns: recentCustomersColumns,
    state: {
      rowSelection,
      pagination,
      sorting,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getSelectedRowModel().rows.length;

  // Filter handlers
  const handleSearchChange = (value: string) => {
    updateUrlParams({ search: value || null, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    updateUrlParams({ status: value === "all" ? null : value, page: 1 });
  };

  const handleBillingChange = (value: string) => {
    updateUrlParams({ billing: value === "all" ? null : value, page: 1 });
  };

  const handleJoinedDateChange = (value: string) => {
    updateUrlParams({ joinedDate: value === "all" ? null : value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    let newSorting: SortingState;
    switch (value) {
      case "oldest":
        newSorting = [{ id: "joined", desc: false }];
        break;
      case "name-asc":
        newSorting = [{ id: "name", desc: false }];
        break;
      case "name-desc":
        newSorting = [{ id: "name", desc: true }];
        break;
      default:
        newSorting = [{ id: "joined", desc: true }];
    }
    setSorting(newSorting);
    updateUrlParams({ page: 1 });
  };

  const getCurrentSortValue = () => {
    if (sorting[0]?.id === "joined" && !sorting[0]?.desc) return "oldest";
    if (sorting[0]?.id === "name" && !sorting[0]?.desc) return "name-asc";
    if (sorting[0]?.id === "name" && sorting[0]?.desc) return "name-desc";
    return "newest";
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              row{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                  <UsersRound className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkStatusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      setSelectedStatus(option.value);
                      setStatusDialogOpen(true);
                    }}
                  >
                    <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
                    Set as {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Update Billing
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkBillingOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      setSelectedBilling(option.value);
                      setBillingDialogOpen(true);
                    }}
                  >
                    <Badge className={`mr-2 ${option.color}`} variant="secondary">
                      {option.label}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={bulkActionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              disabled={bulkActionLoading}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-7 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Search customers..."
              defaultValue={currentSearch}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UsersRound />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-35" align="start">
              <DropdownMenuRadioGroup
                value={currentStatus}
                onValueChange={handleStatusChange}
              >
                {statusOptions.map((status) => (
                  <DropdownMenuRadioItem key={status.value} value={status.value}>
                    {status.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarDays />
                Joined date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuRadioGroup
                value={currentJoinedDate}
                onValueChange={handleJoinedDateChange}
              >
                {joinedDateOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CreditCard />
                Billing
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={currentBilling}
                onValueChange={handleBillingChange}
              >
                {billingOptions.map((billing) => (
                  <DropdownMenuRadioItem key={billing.value} value={billing.value}>
                    {billing.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={getCurrentSortValue()}
                onValueChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/15">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="h-11 p-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
          {selectedCount} of {total.toLocaleString()} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="recent-customers-rows-per-page" className="font-medium text-sm">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                updateUrlParams({ pageSize: Number(value), page: 1 });
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="recent-customers-rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center font-medium text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || loading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || loading}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customers</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} customer{selectedCount !== 1 ? "s" : ""}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={bulkActionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkActionLoading}>
              {bulkActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Customer Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedCount} selected customer{selectedCount !== 1 ? "s" : ""} to {selectedStatus}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={bulkActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateStatus} disabled={bulkActionLoading}>
              {bulkActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Billing Dialog */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Billing Status</DialogTitle>
            <DialogDescription>
              Update billing status for {selectedCount} selected customer{selectedCount !== 1 ? "s" : ""} to {selectedBilling}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingDialogOpen(false)} disabled={bulkActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateBilling} disabled={bulkActionLoading}>
              {bulkActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}