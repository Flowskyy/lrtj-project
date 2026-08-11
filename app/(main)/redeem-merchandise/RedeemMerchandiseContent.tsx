"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatWIBDate, formatDisplayDate } from "@/lib/formatWIBDate";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import ModuleToolbar from "@/components/ModuleToolbar";
import { useExportJob } from "@/hooks/use-export-job";
import ExportProgressDialog from "@/components/ExportProgressDialog";
import { MoreVertical, Eye, Trash2, ChevronDown, Check, X, Download, CheckSquare, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

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
  // No props needed anymore
}

export default function RedeemMerchandiseContent({ }: RedeemMerchandiseContentProps) {
  const router = useRouter();
  const [items, setItems] = useState<RedeemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  

  // Modal and CRUD states
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
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.order = sortOrder;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (categoryFilter !== "all") params.category_id = categoryFilter;
    return params;
  }, [sortBy, sortOrder, searchQuery, dateFrom, dateTo, categoryFilter]);

  const { isExporting, isCancelling, processed, total, percentage, status, startExport, cancelExport } = useExportJob({
    moduleEndpoint: '/api/redeem',
    params: exportParams,
    onError: (msg) => toast.error(msg),
  });

  // Search scopes for Redeem Merchandise
  const redeemSearchScopes: SearchScope[] = [
    { field: "receiver_name", label: "Receiver Name" },
    { field: "merchandise_name", label: "Redeem Item" },
  ];

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
        if (searchScope) params.set("searchScope", searchScope);
      }
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
  }, [sortBy, sortOrder, currentPage, searchQuery, searchScope, dateFrom, dateTo, categoryFilter]);

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
  const activeFilterCount = (searchQuery.trim() ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  // Handle scope selection
  const handleScopeSelect = (scope: SearchScope) => {
    setSearchScope(scope.field);
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowScopeSuggestions(value.length >= 2);
    if (!value.trim()) {
      setSearchScope("");
      setCurrentPage(1);
    }
  };

  // Handle search focus
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowScopeSuggestions(true);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchScope("");
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Records
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : totalRedeems}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : completed}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Redeem Merchandise</h2>
          </div>

          {/* Table Toolbar */}
          <ModuleToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search redeems..."
            searchScopes={redeemSearchScopes}
            searchScope={searchScope}
            onScopeSelect={handleScopeSelect}
            showScopeSuggestions={showScopeSuggestions}
            onScopeSuggestionsClose={() => setShowScopeSuggestions(false)}
            onSearchFocus={handleSearchFocus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortByOptions={[
              { value: "id", label: "ID" },
              { value: "created_at", label: "Created Date" },
              { value: "updated_at", label: "Updated Date" },
            ]}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            categoryOptions={[
              { value: "all", label: "All Categories" },
              { value: "uncategorized", label: "No Category" },
              ...categories.map(cat => ({ value: cat.id.toString(), label: cat.category_name || `Category ${cat.id}` }))
            ]}
            showCategoryFilter={true}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            showDateRange={true}
            onResetFilters={handleResetFilters}
            activeFilterCount={activeFilterCount}
            visibleColumns={visibleColumns}
            onColumnVisibilityToggle={(key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            columnConfigs={[
              { key: "select", label: "Select" },
              { key: "id", label: "ID" },
              { key: "user_id", label: "User ID" },
              { key: "receiver_name", label: "Receiver Name" },
              { key: "merchandise_name", label: "Merchandise" },
              { key: "status", label: "Status" },
              { key: "created_at", label: "Created" },
              { key: "updated_at", label: "Updated" },
              { key: "actions", label: "Actions" },
            ]}
            primaryAction={{
              label: 'Export',
              icon: <Download className="h-4 w-4" />,
              onClick: () => {
                setShowExportDialog(true);
                startExport();
              },
              disabled: isExporting,
              loading: isExporting,
              loadingLabel: 'Exporting...',
            }}
          />

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.select && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-12">
                      Select
                    </TableHead>
                  )}
                  {visibleColumns.id && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-20">
                      ID
                    </TableHead>
                  )}
                  {visibleColumns.user_id && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-20">
                      User ID
                    </TableHead>
                  )}
                  {visibleColumns.receiver_name && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                      Receiver Name
                    </TableHead>
                  )}
                  {visibleColumns.merchandise_name && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[160px]">
                      Merchandise
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Created
                    </TableHead>
                  )}
                  {visibleColumns.updated_at && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Updated
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider text-center w-24">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.select && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-4" /></TableCell>}
                      {visibleColumns.id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.user_id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-4" /></TableCell>}
                      {visibleColumns.id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.user_id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-4" /></TableCell>}
                      {visibleColumns.id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.user_id && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.select && (
                        <TableCell className="px-2 py-1.5">
                          <button
                            className="flex items-center justify-center"
                          >
                            <Square className="h-3 w-3" />
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 font-medium">
                          #{item.id}
                        </TableCell>
                      )}
                      {visibleColumns.user_id && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 font-medium">
                          {item.user_id}
                        </TableCell>
                      )}
                      {visibleColumns.receiver_name && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900">
                          {item.receiver_name}
                        </TableCell>
                      )}
                      {visibleColumns.merchandise_name && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900 max-w-[220px]">
                          <span className="block truncate" title={item.merchandise_name}>
                            {item.merchandise_name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-2 py-1.5">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {item.createdAt ? formatDisplayDate(item.createdAt) : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.updated_at && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {item.updatedAt ? item.updatedAt.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100 p-0 transition-colors">
                              <MoreVertical className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/redeem-merchandise/view/${item.id}`)} className="text-[10px] h-6">
                                <Eye className="h-3 w-3 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteItem(item)} variant="destructive" className="text-[10px] h-6">
                                <Trash2 className="h-3 w-3 mr-2" />
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
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-2 py-6 text-center text-[11px] text-gray-500">
                      No redeem records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-2">
            {loading ? (
              <>
                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/redeem-merchandise/view/${item.id}`)}
                  className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-semibold text-gray-900 truncate">#{item.id} – {item.merchandise_name}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">User ID: {item.user_id}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Receiver: {item.receiver_name}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Created: {item.createdAt ? formatDisplayDate(item.createdAt) : "-"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
                <p className="text-[11px] text-gray-500">No redeem records found.</p>
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
        isCancelling={isCancelling}
      />
    </div>
  );
}
