"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { Skeleton } from "@/components/ui/skeleton";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import { useExportJob } from "@/hooks/use-export-job";
import ExportProgressDialog from "@/components/ExportProgressDialog";
import { Filter, MoreVertical, Eye, Trash2, Search, Columns, ChevronDown, Check, X, Download, CheckSquare, Square } from "lucide-react";
import MerchandiseSearchCombobox from "@/components/MerchandiseSearchCombobox";
import UserSearchCombobox from "@/components/UserSearchCombobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RedeemItem {
  id: number;
  user_id: number;
  merchandise_id: number;
  merchandise_name: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Category {
  id: number;
  category_name: string | null;
}

interface RedeemMerchandiseContentProps {
  username: string;
}

export default function RedeemMerchandiseContent({ username }: RedeemMerchandiseContentProps) {
  const [items, setItems] = useState<RedeemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<RedeemItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RedeemItem | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    select: false,
    id: false,
    user_id: false,
    receiver_name: true,
    merchandise_name: true,
    status: false,
    created_at: true,
    updated_at: false,
    actions: true,
  });

  // Export job hook
  const exportParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.order = sortOrder;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (categoryFilter !== "all") params.category_id = categoryFilter;
    return params;
  }, [statusFilter, sortBy, sortOrder, searchQuery, dateFrom, dateTo, categoryFilter]);

  const { isExporting, processed, total, percentage, status, startExport, cancelExport } = useExportJob({
    moduleEndpoint: '/api/redeem',
    params: exportParams,
    onError: (msg) => toast.error(msg),
  });

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
      if (categoryFilter !== "all") params.set("category_id", categoryFilter);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/redeem?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setCompletedCount(response.meta?.completed || 0);
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
  }, [statusFilter, sortBy, sortOrder, currentPage, searchQuery, dateFrom, dateTo, categoryFilter]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/merchandise-category");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Count active filters
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("created_at");
    setSortOrder("desc");
    setCategoryFilter("all");
  };

  // Delete Item
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/redeem/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("Redeem record deleted successfully");
      } else {
        toast.error("Failed to delete redeem record");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete redeem record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed values
  const totalRedeems = totalCount;
  const completed = completedCount;



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalRedeems}
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
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent>
          <CardHeader className="p-3">
            <CardTitle className="text-lg">Redeem Merchandise</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search redeems..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 min-h-[44px] w-full sm:w-64"
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
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value || "all")}>
                <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
                  <SelectValue placeholder="All Categories">
                    {categoryFilter !== "all" ? categories.find(c => c.id === parseInt(categoryFilter))?.category_name || `Category ${categoryFilter}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.category_name || `Category ${cat.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TableFilterSortMenu
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                statusOptions={[
                  { value: "all", label: "All" },
                  { value: "completed", label: "Completed" },
                  { value: "rejected", label: "Rejected" },
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, select: !prev.select }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.select && <Check className="h-4 w-4" />}
                      <span>Select</span>
                    </div>
                  </DropdownMenuItem>
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, receiver_name: !prev.receiver_name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.receiver_name && <Check className="h-4 w-4" />}
                      <span>Receiver Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, merchandise_name: !prev.merchandise_name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.merchandise_name && <Check className="h-4 w-4" />}
                      <span>Merchandise</span>
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
            <Button
              onClick={() => {
                setShowExportDialog(true);
                startExport();
              }}
              disabled={isExporting}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.select && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </TableHead>
                  )}
                  {visibleColumns.id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20">
                      ID
                    </TableHead>
                  )}
                  {visibleColumns.user_id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20">
                      User ID
                    </TableHead>
                  )}
                  {visibleColumns.receiver_name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Receiver Name
                    </TableHead>
                  )}
                  {visibleColumns.merchandise_name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">
                      Merchandise
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Created
                    </TableHead>
                  )}
                  {visibleColumns.updated_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Updated
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-24">
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
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
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
                        <TableCell className="px-4 py-3">
                          <button
                            className="flex items-center justify-center"
                          >
                            <Square className="h-4 w-4" />
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="px-4 py-3 text-sm text-gray-600 font-medium">
                          #{item.id}
                        </TableCell>
                      )}
                      {visibleColumns.user_id && (
                        <TableCell className="px-4 py-3 text-sm text-gray-600 font-medium">
                          {item.user_id}
                        </TableCell>
                      )}
                      {visibleColumns.receiver_name && (
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.receiver_name}
                        </TableCell>
                      )}
                      {visibleColumns.merchandise_name && (
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[220px]">
                          <span className="block truncate" title={item.merchandise_name}>
                            {item.merchandise_name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-4 py-3 text-sm text-gray-600">
                          {item.createdAt ? item.createdAt.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.updated_at && (
                        <TableCell className="px-4 py-3 text-sm text-gray-600">
                          {item.updatedAt ? item.updatedAt.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-4 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 hover:text-gray-700 p-0 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewItem(item)} className="text-sm h-9">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteItem(item)} variant="destructive" className="text-sm h-9">
                                <Trash2 className="h-4 w-4 mr-2" />
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
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-sm text-gray-500">
                      No redeem records found.
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
                        <h3 className="text-sm font-bold text-gray-900 truncate">#{item.id} – {item.merchandise_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">User ID: {item.user_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Receiver: {item.receiver_name}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created: {item.createdAt ? item.createdAt.split('T')[0] : "-"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No redeem records found.
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
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle>View Redeem Record</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4 rounded-b-xl">
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Receiver Name</label>
              <div className="text-sm text-gray-900">{viewItem?.receiver_name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Receiver Phone</label>
                <div className="text-sm text-gray-900">{viewItem?.receiver_phone}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Receiver Email</label>
                <div className="text-sm text-gray-900">{viewItem?.receiver_email}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Receiver Address</label>
              <div className="text-sm text-gray-900">{viewItem?.receiver_address}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Merchandise</label>
              <div className="text-sm text-gray-900">{viewItem?.merchandise_name}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <div><StatusBadge status={viewItem?.status || ''} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{formatWIBDate(viewItem?.createdAt)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{formatWIBDate(viewItem?.updatedAt)}</div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setViewItem(null)} className="min-h-[44px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        title="Delete Redeem Record"
        description="Are you sure you want to delete this redeem record? This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Export Progress Dialog */}
      <ExportProgressDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        status={status === 'idle' ? null : { status, processed, total, percentage }}
        onCancel={cancelExport}
      />
    </div>
  );
}
