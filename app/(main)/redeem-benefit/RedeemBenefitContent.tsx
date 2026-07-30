"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import ExportDialog from "@/components/ExportDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import { exportToExcel, ExportColumn } from "@/lib/exportToExcel";
import { Filter, MoreVertical, Eye, Trash2, Search, Columns, ChevronDown, Check, X, Download, CheckSquare, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RedeemBenefitItem {
  id: number;
  user_id: number;
  merchant_id: number;
  name: string;
  email: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface RedeemBenefitContentProps {
  username: string;
}

export default function RedeemBenefitContent({ username }: RedeemBenefitContentProps) {
  const [items, setItems] = useState<RedeemBenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<RedeemBenefitItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RedeemBenefitItem | null>(null);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    id: false,
    user_id: false,
    merchant_id: false,
    name: true,
    email: true,
    status: false,
    created_at: true,
    updated_at: false,
    actions: true,
  });

  // Row selection states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/redeem-benefit?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setStatusCounts(response.meta?.statusCounts || {});
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, sortBy, sortOrder, currentPage, searchQuery, dateFrom, dateTo]);

  // Count active filters
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("id");
    setSortOrder("asc");
  };

  // Delete Item
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/redeem-benefit/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("Redeem benefit record deleted successfully");
      } else {
        toast.error("Failed to delete redeem benefit record");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete redeem benefit record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge color for stat cards
  const getStatusCardColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed" || statusLower === "approved") {
      return { bg: "bg-green-100", text: "text-green-700", svgColor: "text-green-700" };
    } else if (statusLower === "process" || statusLower === "pending") {
      return { bg: "bg-yellow-100", text: "text-yellow-700", svgColor: "text-yellow-700" };
    } else if (statusLower === "rejected" || statusLower === "cancelled") {
      return { bg: "bg-red-100", text: "text-red-700", svgColor: "text-red-700" };
    }
    return { bg: "bg-gray-100", text: "text-gray-500", svgColor: "text-gray-500" };
  };

  // Get unique status keys for stat cards
  const statusKeys = Object.keys(statusCounts);

  // Handle row selection
  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(items.map(item => item.id)));
    }
  };

  // Export handlers
  const handleExport = async (scope: "full" | "preview") => {
    setExporting(true);
    try {
      let dataToExport: RedeemBenefitItem[];
      
      if (selectedRows.size > 0) {
        // Export only checked rows
        dataToExport = items.filter(item => selectedRows.has(item.id));
      } else {
        // Fetch all filtered data
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("order", sortOrder);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("export", "true");

        const res = await fetch(`/api/redeem-benefit?${params}`);
        if (res.ok) {
          const response = await res.json();
          dataToExport = response.data || [];
        } else {
          dataToExport = [];
        }
      }

      let columns: ExportColumn[];
      if (scope === "full") {
        columns = [
          { key: "id", label: "ID" },
          { key: "user_id", label: "User ID" },
          { key: "merchant_id", label: "Merchant ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Created At" },
          { key: "updated_at", label: "Updated At" },
        ];
      } else {
        // Dynamic columns based on visibleColumns
        columns = [];
        if (visibleColumns.name) columns.push({ key: "name", label: "Name" });
        if (visibleColumns.email) columns.push({ key: "email", label: "Email" });
        if (visibleColumns.created_at) columns.push({ key: "created_at", label: "Created" });
        if (visibleColumns.status) columns.push({ key: "status", label: "Status" });
        if (visibleColumns.id) columns.push({ key: "id", label: "ID" });
        if (visibleColumns.user_id) columns.push({ key: "user_id", label: "User ID" });
        if (visibleColumns.merchant_id) columns.push({ key: "merchant_id", label: "Merchant ID" });
        if (visibleColumns.updated_at) columns.push({ key: "updated_at", label: "Updated" });
      }

      exportToExcel(dataToExport, columns, "redeem-benefit-export");
      setExportDialogOpen(false);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  // Get field lists for export dialog
  const fullDataFields = ["ID", "User ID", "Merchant ID", "Name", "Email", "Status", "Created At", "Updated At"];
  const getPreviewFields = () => {
    const fields: string[] = [];
    if (visibleColumns.name) fields.push("Name");
    if (visibleColumns.email) fields.push("Email");
    if (visibleColumns.created_at) fields.push("Created");
    if (visibleColumns.status) fields.push("Status");
    if (visibleColumns.id) fields.push("ID");
    if (visibleColumns.user_id) fields.push("User ID");
    if (visibleColumns.merchant_id) fields.push("Merchant ID");
    if (visibleColumns.updated_at) fields.push("Updated");
    return fields;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        {statusKeys.slice(0, 2).map((status) => {
          const colors = getStatusCardColor(status);
          return (
            <Card key={status} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {status}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${colors.text}`}>
                      {loading ? "..." : statusCounts[status]}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <svg className={`h-5 w-5 ${colors.svgColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent>
          <CardHeader className="p-3">
            <CardTitle className="text-lg">Redeem Benefit</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setExportDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white min-h-[44px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <div className="relative flex-1 sm:flex-none">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  <Input
                    type="text"
                    placeholder="Search by name, email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-8 min-h-[36px]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <TableFilterSortMenu
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                statusOptions={[
                  { value: "all", label: "All" },
                  ...statusKeys.map((status) => ({ 
                    value: status, 
                    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
                  })),
                ]}
                sortByOptions={[
                  { value: "id", label: "ID" },
                  { value: "created_at", label: "Created Date" },
                  { value: "updated_at", label: "Updated Date" },
                ]}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                showDateRange={true}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px]">
                  <Columns className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, id: !prev.id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.id && <Check className="h-4 w-4" />}
                      <span>ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, user_id: !prev.user_id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.user_id && <Check className="h-4 w-4" />}
                      <span>User ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, merchant_id: !prev.merchant_id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.merchant_id && <Check className="h-4 w-4" />}
                      <span>Merchant ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, name: !prev.name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.name && <Check className="h-4 w-4" />}
                      <span>Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, email: !prev.email }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.email && <Check className="h-4 w-4" />}
                      <span>Email</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, status: !prev.status }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.status && <Check className="h-4 w-4" />}
                      <span>Status</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, created_at: !prev.created_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.created_at && <Check className="h-4 w-4" />}
                      <span>Created</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, updated_at: !prev.updated_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.updated_at && <Check className="h-4 w-4" />}
                      <span>Updated</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, actions: !prev.actions }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.actions && <Check className="h-4 w-4" />}
                      <span>Actions</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.select && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center"
                      >
                        {selectedRows.size === items.length && items.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        ID
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.user_id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      User ID
                    </TableHead>
                  )}
                  {visibleColumns.merchant_id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Merchant ID
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </TableHead>
                  )}
                  {visibleColumns.updated_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Updated
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.select && (
                        <TableCell className="px-3 py-1.5">
                          <button
                            onClick={() => handleSelectRow(item.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedRows.has(item.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          #{item.id}
                        </TableCell>
                      )}
                      {visibleColumns.user_id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          {item.user_id}
                        </TableCell>
                      )}
                      {visibleColumns.merchant_id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          {item.merchant_id}
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900">
                          {item.name}
                        </TableCell>
                      )}
                      {visibleColumns.email && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 max-w-[200px]">
                          <span className="block truncate" title={item.email}>
                            {item.email}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-3 py-1.5">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.created_at ? item.created_at.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.updated_at && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.updated_at ? item.updated_at.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-3 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewItem(item)} className="text-xs h-8">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteItem(item)} variant="destructive" className="text-xs h-8">
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-12 text-center text-xs text-gray-400">
                      No redeem benefit records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">#{item.id} – {item.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">User ID: {item.user_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Merchant ID: {item.merchant_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Email: {item.email}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created: {item.created_at ? item.created_at.split('T')[0] : "-"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No redeem benefit records found.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={totalCount}
            pageSize={50}
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>View Redeem Benefit</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ID</label>
                <div className="text-sm text-gray-900">#{viewItem?.id}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">User ID</label>
                <div className="text-sm text-gray-900">{viewItem?.user_id}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Merchant ID</label>
                <div className="text-sm text-gray-900">{viewItem?.merchant_id}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <div><StatusBadge status={viewItem?.status || ''} /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <div className="text-sm text-gray-900">{viewItem?.name}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <div className="text-sm text-gray-900">{viewItem?.email}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{viewItem?.created_at ? viewItem.created_at.replace('T', ' ').substring(0, 16) : '-'}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{viewItem?.updated_at ? viewItem.updated_at.replace('T', ' ').substring(0, 16) : '-'}</div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              onClick={() => setViewItem(null)}
              variant="outline"
              className="min-h-[44px]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        title="Delete Redeem Benefit"
        description={
          deleteItem && (
            <>Are you sure you want to delete this redeem benefit record for <span className="font-bold text-gray-900">"{deleteItem.name}"</span>? This action cannot be undone.</>
          )
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        loading={exporting}
        fullDataFields={fullDataFields}
        previewDataFields={getPreviewFields()}
        selectedCount={selectedRows.size}
        totalFilteredCount={totalCount}
      />
    </div>
  );
}
