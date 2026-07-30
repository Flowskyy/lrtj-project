"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToExcel, ExportColumn } from "@/lib/exportToExcel";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import Pagination from "@/components/Pagination";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Search, Eye, ChevronDown, X, Download, Columns, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EarningItem {
  id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  info: string;
  earning_point: number;
  category: string;
  type: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LarataClubEarningContentProps {
  username: string;
}

export default function LarataClubEarningContent({ username }: LarataClubEarningContentProps) {
  const [items, setItems] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter and Sort states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Available filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  // Modal states
  const [viewItem, setViewItem] = useState<EarningItem | null>(null);
  const [exporting, setExporting] = useState(false);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    user: true,
    earning_point: true,
    category: true,
    type: true,
    info: true,
    created_at: true,
    actions: true,
  });

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const res = await fetch(`/api/larata-club-earning?debug=values`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setTypes(data.types || []);
      }
    } catch (err) {
      console.error("Failed to fetch filter options", err);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/larata-club-earning?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
      toast.error("Failed to fetch earning history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [categoryFilter, typeFilter, sortBy, sortOrder, searchQuery, page, dateFrom, dateTo]);

  // Debounced search
  const { handleSearchChange } = useDebouncedSearch({ delay: 300 });

  const onSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on search
    handleSearchChange(() => {
      // Search is handled by the useEffect
    });
  }, [handleSearchChange]);

  const activeFilterCount = (categoryFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleResetFilters = () => {
    setCategoryFilter("all");
    setTypeFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // View Item
  const handleViewItem = (item: EarningItem) => {
    setViewItem(item);
  };

  // Format date (no timezone conversion)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return dateString.split('T')[0];
  };

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      params.set("export", "true");

      const res = await fetch(`/api/larata-club-earning?${params}`);
      if (res.ok) {
        const response = await res.json();
        const data = response.data || [];

        const columns: ExportColumn[] = [
          { key: "user_name", label: "User Name" },
          { key: "user_email", label: "User Email" },
          { key: "category", label: "Category" },
          { key: "type", label: "Type" },
          { key: "earning_point", label: "Earning Point" },
          { key: "info", label: "Info" },
          { key: "created_at", label: "Created At" },
        ];

        exportToExcel(data, columns, "larata-club-earning");
        toast.success("Export successful");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Computed values
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
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
            <div className="flex flex-wrap items-center justify-between">
              <CardTitle className="text-lg">LarataClub Earning History</CardTitle>
            </div>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search user name/email..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 min-h-[44px] w-full sm:w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <TableFilterSortMenu
                statusFilter={categoryFilter}
                onStatusFilterChange={(value) => { setCategoryFilter(value); setPage(1); }}
                typeFilter={typeFilter}
                onTypeFilterChange={(value) => { setTypeFilter(value); setPage(1); }}
                showCategoryFilter={true}
                showTypeFilter={true}
                categoryOptions={[
                  { value: "all", label: "All Categories" },
                  ...categories.map(cat => ({ value: cat, label: cat }))
                ]}
                typeOptions={[
                  { value: "all", label: "All Types" },
                  ...types.map(type => ({ value: type, label: type }))
                ]}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                dateFrom={dateFrom}
                onDateFromChange={(value) => { setDateFrom(value); setPage(1); }}
                dateTo={dateTo}
                onDateToChange={(value) => { setDateTo(value); setPage(1); }}
                showDateRange={true}
                sortByOptions={[
                  { value: "created_at", label: "Created Date" },
                  { value: "earning_point", label: "Earning Point" },
                  { value: "id", label: "ID" },
                ]}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px]">
                  <Columns className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, user: !prev.user }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.user && <Check className="h-4 w-4" />}
                      <span>User</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, earning_point: !prev.earning_point }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.earning_point && <Check className="h-4 w-4" />}
                      <span>Earning Point</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, category: !prev.category }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.category && <Check className="h-4 w-4" />}
                      <span>Category</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, type: !prev.type }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.type && <Check className="h-4 w-4" />}
                      <span>Type</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, info: !prev.info }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.info && <Check className="h-4 w-4" />}
                      <span>Info</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, created_at: !prev.created_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.created_at && <Check className="h-4 w-4" />}
                      <span>Created At</span>
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
              onClick={handleExport}
              disabled={exporting}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.user && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                      User
                    </TableHead>
                  )}
                  {visibleColumns.earning_point && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Earning Point
                    </TableHead>
                  )}
                  {visibleColumns.category && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Category
                    </TableHead>
                  )}
                  {visibleColumns.type && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Type
                    </TableHead>
                  )}
                  {visibleColumns.info && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[150px] max-w-[200px]">
                      Info
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-36">
                      Created At
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
                      {visibleColumns.user && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-16" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.user && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-16" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.user && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-16" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.user && (
                        <TableCell className="px-3 py-1.5">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate" title={item.user_name}>
                              {item.user_name || "-"}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate" title={item.user_email}>
                              {item.user_email || "-"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.earning_point && (
                        <TableCell className="px-3 py-1.5 text-xs font-semibold text-gray-700">
                          {item.earning_point.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleColumns.category && (
                        <TableCell className="px-3 py-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.category || "-"}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell className="px-3 py-1.5">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {item.type || "-"}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.info && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 truncate max-w-[200px]" title={item.info}>
                          {item.info || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-3 py-1.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewItem(item)}
                            className="h-7 w-7"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-12 text-center text-xs text-gray-400">
                      No earning history found.
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
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-28 mb-3" />
                  <Skeleton className="h-11 w-11" />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-28 mb-3" />
                  <Skeleton className="h-11 w-11" />
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={item.user_name}>
                        {item.user_name || "-"}
                      </h3>
                      <p className="text-[10px] text-gray-500 truncate" title={item.user_email}>
                        {item.user_email || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {item.earning_point.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.category || "-"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {item.type || "-"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-3" title={item.info}>
                    {item.info || "-"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewItem(item)}
                      className="min-h-[44px] px-3"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
                <p className="text-xs text-gray-400">No earning history found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalCount={totalCount}
            pageSize={limit}
            className="pt-4 border-t border-gray-100"
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Earning History Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {viewItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">User Name</p>
                    <p className="text-sm text-gray-900">{viewItem.user_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">User Email</p>
                    <p className="text-sm text-gray-900">{viewItem.user_email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Earning Point</p>
                    <p className="text-sm font-semibold text-gray-900">{viewItem.earning_point.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Category</p>
                    <p className="text-sm text-gray-900">{viewItem.category || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Type</p>
                    <p className="text-sm text-gray-900">{viewItem.type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Created At</p>
                    <p className="text-sm text-gray-900">{formatDate(viewItem.created_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Info</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewItem.info || "-"}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
