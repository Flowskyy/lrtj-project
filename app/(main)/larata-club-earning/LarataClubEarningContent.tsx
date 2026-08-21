"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleToolbar from "@/components/ModuleToolbar";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import { formatWIBDate } from "@/lib/formatWIBDate";
import Pagination from "@/components/Pagination";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useExportJob } from "@/hooks/use-export-job";
import ExportProgressDialog from "@/components/ExportProgressDialog";
import { Eye, X, Search, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  created_at: string | null;
  updated_at: string | null;
}

interface LarataClubEarningContentProps {
  // No props needed anymore
}

export default function LarataClubEarningContent({ }: LarataClubEarningContentProps) {
  const [items, setItems] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter and Sort states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Prefetching state
  const pageCacheRef = useRef<Map<string, { data: EarningItem[]; total: number }>>(new Map());
  const prefetchAbortControllerRef = useRef<AbortController | null>(null);
  const inFlightPrefetchRef = useRef<Set<string>>(new Set());

  // Available filter options
  const [categories, setCategories] = useState<string[]>([]);

  // Modal states
  const [viewItem, setViewItem] = useState<EarningItem | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Export job hook
  const exportParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (categoryFilter !== "all") params.category = categoryFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (searchScope) params.searchScope = searchScope;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.order = sortOrder;
    return params;
  }, [categoryFilter, searchQuery, searchScope, dateFrom, dateTo, sortBy, sortOrder]);

  const { isExporting, isCancelling, processed, total, percentage, status, startExport, cancelExport } = useExportJob({
    moduleEndpoint: '/api/larata-club-earning',
    params: exportParams,
    onError: (msg) => toast.error(msg),
  });

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    user: true,
    earning_point: true,
    category: true,
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
      }
    } catch (err) {
      console.error("Failed to fetch filter options", err);
    }
  };

  // Search scopes for LarataClub History
  const earningSearchScopes: SearchScope[] = [
    { field: "user_email", label: "Email" },
    { field: "user_name", label: "Name" },
  ];

  // Reset filters handler
  const handleResetFilters = () => {
    // Cancel any in-flight prefetch
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
      prefetchAbortControllerRef.current = null;
    }

    // Clear cache on filter reset
    pageCacheRef.current.clear();

    setCategoryFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setSearchQuery("");
    setSearchScope("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Active filter count
  const activeFilterCount = (categoryFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  // Handle column visibility toggle
  const handleColumnVisibilityToggle = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // Generate cache key for a page with current filters
  const getCacheKey = useCallback((pageNum: number) => {
    return JSON.stringify({
      page: pageNum,
      category: categoryFilter,
      search: searchQuery.trim(),
      searchScope: searchScope,
      dateFrom: dateFrom,
      dateTo: dateTo,
      sortBy: sortBy,
      sortOrder: sortOrder,
    });
  }, [categoryFilter, searchQuery, searchScope, dateFrom, dateTo, sortBy, sortOrder]);

  // Fetch items (main function used for both active and prefetch)
  const fetchItems = async (pageNum: number, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
      if (searchScope) params.set("searchScope", searchScope);
    }
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("order", sortOrder);
    params.set("page", pageNum.toString());
    params.set("limit", limit.toString());

    const res = await fetch(`/api/larata-club-earning?${params}`, { signal });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', errorText);
      throw new Error("Failed to fetch");
    }
    const response = await res.json();
    return {
      data: response.data || [],
      total: response.meta?.total || 0,
    };
  };

  // Prefetch next page in background
  const prefetchNextPage = useCallback(() => {
    // Cancel any in-flight prefetch
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
    }

    const nextPage = page + 1;
    const totalPages = Math.ceil(totalCount / limit);

    // Only prefetch if there's a next page
    if (nextPage > totalPages) return;

    const cacheKey = getCacheKey(nextPage);

    // Skip if already cached
    if (pageCacheRef.current.has(cacheKey)) return;

    // Skip if already in-flight (defense in depth)
    if (inFlightPrefetchRef.current.has(cacheKey)) return;

    const controller = new AbortController();
    prefetchAbortControllerRef.current = controller;
    inFlightPrefetchRef.current.add(cacheKey);

    // Fetch in background without loading state
    fetchItems(nextPage, controller.signal)
      .then(({ data, total }) => {
        pageCacheRef.current.set(cacheKey, { data, total });
      })
      .catch((err) => {
        // Ignore abort errors - they're expected when cancelling
        if (err.name !== 'AbortError') {
          console.error("Prefetch failed:", err);
        }
      })
      .finally(() => {
        inFlightPrefetchRef.current.delete(cacheKey);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalCount, limit, getCacheKey]);

  // Fetch items for current page (from cache or network)
  const loadCurrentPage = useCallback(async () => {
    setLoading(true);

    // Cancel any in-flight prefetch
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
      prefetchAbortControllerRef.current = null;
    }

    const cacheKey = getCacheKey(page);

    // Check cache first
    if (pageCacheRef.current.has(cacheKey)) {
      const cached = pageCacheRef.current.get(cacheKey)!;
      setItems(cached.data);
      setTotalCount(cached.total);
      setLoading(false);

      // Trigger prefetch for next page after render
      setTimeout(() => prefetchNextPage(), 100);
      return;
    }

    try {
      const { data, total } = await fetchItems(page);
      setItems(data);
      setTotalCount(total);

      // Cache this page
      pageCacheRef.current.set(cacheKey, { data, total });

      // Trigger prefetch for next page after render
      setTimeout(() => prefetchNextPage(), 100);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Failed to fetch items", err);
        toast.error(`Failed to fetch earning history: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, getCacheKey, prefetchNextPage]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Clear cache when filters change (to avoid showing stale data)
  useEffect(() => {
    pageCacheRef.current.clear();
  }, [categoryFilter, searchQuery, searchScope, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    loadCurrentPage();
  }, [loadCurrentPage]);

  // Debounced search
  const { handleSearchChange: debouncedSearchChange } = useDebouncedSearch({ delay: 300 });

  // Handle scope selection
  const handleScopeSelect = (scope: SearchScope) => {
    setSearchScope(scope.field);
  };

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    setShowScopeSuggestions(value.length >= 2);
    if (!value.trim()) {
      setSearchScope("");
    }
  };

  // Handle search focus
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowScopeSuggestions(true);
    }
  };

  const onSearchChange = useCallback((value: string) => {
    // Cancel any in-flight prefetch immediately
    if (prefetchAbortControllerRef.current) {
      prefetchAbortControllerRef.current.abort();
      prefetchAbortControllerRef.current = null;
    }

    handleSearchInputChange(value);
    debouncedSearchChange(() => {
      // Search is handled by the useEffect
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchChange]);

  // View Item
  const handleViewItem = (item: EarningItem) => {
    setViewItem(item);
  };





  // Computed values
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Records
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : totalCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-gray-600"
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
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">LarataClub History</h2>
          </div>

          {/* Table Toolbar */}
          <ModuleToolbar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search user name/email..."
            searchScopes={earningSearchScopes}
            searchScope={searchScope}
            onScopeSelect={handleScopeSelect}
            showScopeSuggestions={showScopeSuggestions}
            onScopeSuggestionsClose={() => setShowScopeSuggestions(false)}
            onSearchFocus={() => {
              if (searchQuery.length >= 2) {
                setShowScopeSuggestions(true);
              }
            }}
            sortBy={sortBy}
            onSortByChange={(value) => { setSortBy(value); }}
            sortOrder={sortOrder}
            onSortOrderChange={(value) => { setSortOrder(value); }}
            sortByOptions={[
              { value: "created_at", label: "Created Date" },
              { value: "earning_point", label: "LarataClub Points" },
              { value: "id", label: "ID" },
            ]}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={(value) => { setCategoryFilter(value); }}
            categoryOptions={[
              { value: "all", label: "All Categories" },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            showCategoryFilter={true}
            dateFrom={dateFrom}
            onDateFromChange={(value) => { setDateFrom(value); }}
            dateTo={dateTo}
            onDateToChange={(value) => { setDateTo(value); }}
            showDateRange={true}
            onResetFilters={handleResetFilters}
            activeFilterCount={activeFilterCount}
            visibleColumns={visibleColumns}
            onColumnVisibilityToggle={handleColumnVisibilityToggle}
            columnConfigs={[
              { key: "user", label: "User" },
              { key: "earning_point", label: "LarataClub Points" },
              { key: "category", label: "Category" },
              { key: "info", label: "Info" },
              { key: "created_at", label: "Created At" },
              { key: "actions", label: "Actions" },
            ]}
            primaryAction={{
              label: 'Export',
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
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                <TableRow>
                  {visibleColumns.user && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]">
                      User
                    </TableHead>
                  )}
                  {visibleColumns.earning_point && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      LarataClub Points
                    </TableHead>
                  )}
                  {visibleColumns.category && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Category
                    </TableHead>
                  )}
                  {visibleColumns.info && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[150px] max-w-[200px]">
                      Info
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-36">
                      Created At
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider text-center w-24">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.user && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-3 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.user && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-3 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.user && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.earning_point && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.info && <TableCell><Skeleton className="h-3 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-3 w-28" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.user && (
                        <TableCell className="px-2 py-1.5">
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium text-gray-900 truncate" title={item.user_name}>
                              {item.user_name || "-"}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate" title={item.user_email}>
                              {item.user_email || "-"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.earning_point && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-semibold text-gray-700">
                          {item.earning_point.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleColumns.category && (
                        <TableCell className="px-2 py-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.category || "-"}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.info && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-500 truncate max-w-[200px]" title={item.info}>
                          {item.info || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-500">
                          {formatWIBDate(item.created_at)}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewItem(item)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
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
          <div className="md:hidden space-y-4">
            {loading ? (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-28 mb-3" />
                  <Skeleton className="h-9 w-20" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-28 mb-3" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={item.user_name}>
                        {item.user_name || "-"}
                      </h3>
                      <p className="text-xs text-gray-500 truncate" title={item.user_email}>
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
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.category || "-"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-3" title={item.info}>
                    {item.info || "-"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatWIBDate(item.created_at)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewItem(item)}
                      className="h-9 px-3"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <p className="text-sm text-gray-400">No earning history found.</p>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-900">History Details</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            {viewItem && (
              <div className="pt-2 pb-4">
                {/* Hero: Points earned - the key information */}
                <div className="text-center py-6 border-b border-gray-100 mb-6">
                  <div className="text-4xl font-bold text-[#E5262C] mb-1">
                    {viewItem.earning_point.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    {viewItem.earning_point > 0 ? "POINTS EARNED" : viewItem.earning_point < 0 ? "POINTS SPENT" : "POINTS"}
                  </div>
                </div>

                {/* User section - clean typographic header */}
                <div className="mb-6">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    User
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-500">Name</span>
                      <span className="text-sm font-medium text-gray-900">{viewItem.user_name || "-"}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="text-sm font-medium text-gray-900 text-right break-words max-w-[60%]" title={viewItem.user_email}>
                        {viewItem.user_email || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction section - clean typographic header */}
                <div className="mb-6">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Transaction
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm font-medium text-gray-900">{viewItem.category || "-"}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-500">Date</span>
                      <span className="text-sm font-medium text-gray-900">{formatWIBDate(viewItem.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional info - if present */}
                {viewItem.info && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Notes
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                      {viewItem.info}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
