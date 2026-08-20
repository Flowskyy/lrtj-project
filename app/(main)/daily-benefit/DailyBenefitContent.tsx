"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import ImageUpload from "@/components/ImageUpload";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import { Filter, Plus, MoreVertical, Pencil, Trash2, Search, Columns, ChevronDown, Check, X, Eye } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { formatWIBDate } from "@/lib/formatWIBDate";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DailyBenefitItem {
  id: number;
  editedBy?: string;
  name: string;
  image_url: string;
  redeem_point: number;
  term_condition: string;
  created_at: string | null;
  updated_at: string | null;
  status: number;
  start_date: string | null;
  end_date: string | null;
  is_active: number | null;
}

interface DailyBenefitContentProps {
  // No props needed anymore
}

export default function DailyBenefitContent({ }: DailyBenefitContentProps) {
  const router = useRouter();
  const [items, setItems] = useState<DailyBenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);

  // Modal and CRUD states
  const [deleteItem, setDeleteItem] = useState<DailyBenefitItem | null>(null);
  const [previewItem, setPreviewItem] = useState<DailyBenefitItem | null>(null);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    name: true,
    points: true,
    status: true,
    is_active: true,
    start_date: true,
    end_date: true,
    editedBy: true,
    actions: true,
  });

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/daily-benefit?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setActiveCount(response.meta?.active || 0);
        setInactiveCount(response.meta?.inactive || 0);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search scopes for Daily Benefit
  const dailyBenefitSearchScopes: SearchScope[] = [
    { field: "editedBy", label: "Last Edited By" },
    { field: "name", label: "Daily Benefit Name" },
  ];

  // Filter items based on search query and scope (memoized for performance)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      if (searchScope === 'editedBy') {
        return item.editedBy?.toLowerCase().includes(query);
      } else if (searchScope === 'name') {
        return item.name.toLowerCase().includes(query);
      } else {
        // Default: search both name and editedBy
        return item.name.toLowerCase().includes(query) ||
               item.editedBy?.toLowerCase().includes(query);
      }
    });
  }, [items, searchQuery, searchScope]);
  const activeFilterCount = useMemo(() => {
    return (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);
  }, [searchQuery, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchScope("");
    setStatusFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Handle scope selection
  const handleScopeSelect = (scope: SearchScope) => {
    setSearchScope(scope.field);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowScopeSuggestions(value.length >= 2);
    if (!value.trim()) {
      setSearchScope("");
    }
  };

  // Delete Item
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/daily-benefit/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("Daily Benefit deleted successfully");
      } else {
        toast.error("Failed to delete daily benefit");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete daily benefit");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed values
  const totalBenefits = totalCount;
  const active = activeCount;
  const inactive = inactiveCount;


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Daily Benefits
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalBenefits}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Active
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : active}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : inactive}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
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
            <h2 className="text-xl font-semibold text-gray-900">Daily Benefit Management</h2>
            <Link href="/daily-benefit/add">
              <Button className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Benefit
              </Button>
            </Link>
          </div>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search daily benefits..."
                  className="pl-10 h-9 border border-gray-200 shadow-sm rounded-lg focus:border-gray-300"
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowScopeSuggestions(true);
                    }
                  }}
                />
                <SearchScopeSuggestions
                  searchQuery={searchQuery}
                  scopes={dailyBenefitSearchScopes}
                  onScopeSelect={handleScopeSelect}
                  isVisible={showScopeSuggestions}
                  onClose={() => setShowScopeSuggestions(false)}
                />
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
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                sortByOptions={[
                  { value: "created_at", label: "Created Date" },
                  { value: "name", label: "Name" },
                  { value: "redeem_point", label: "Points" },
                ]}
                showStatusFilter={true}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[40px] shadow-sm">
                  <Columns className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" side="bottom" collisionAvoidance={{ side: 'shift' }}>
                  {visibleColumns.image && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, image: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Image</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.name && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, name: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Name</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.points && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, points: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Points</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.status && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, status: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Status</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.is_active && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, is_active: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Active</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.start_date && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, start_date: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Start Date</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.end_date && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, end_date: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>End Date</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.editedBy && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, editedBy: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Last Edited By</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {visibleColumns.actions && (
                    <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, actions: false }))}>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        <span>Actions</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                <TableRow>
                  {visibleColumns.image && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-40">
                      Image
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[100px] max-w-[140px]">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronDown className="h-2.5 w-2.5" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.points && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20">
                      <div className="flex items-center gap-1">
                        Points
                        <ChevronDown className="h-2.5 w-2.5" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.is_active && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Active
                    </TableHead>
                  )}
                  {visibleColumns.start_date && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      Start Date
                    </TableHead>
                  )}
                  {visibleColumns.end_date && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      End Date
                    </TableHead>
                  )}
                  {visibleColumns.editedBy && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[100px] max-w-[120px]">
                      Last Edited By
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider text-center w-32">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-20 w-28 rounded-lg" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-20 w-28 rounded-lg" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-20 w-28 rounded-lg" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.image && (
                        <TableCell className="px-2 py-1.5">
                          <div className="aspect-video w-28 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                                (e.target as HTMLImageElement).className = "h-6 w-auto object-contain brightness-95";
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900 max-w-[140px]">
                          <span className="block truncate" title={item.name}>
                            {item.name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.points && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-semibold text-[#E5262C]">
                          {item.redeem_point} pts
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-2 py-1.5">
                          {item.status === 1 ? (
                            <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[10px] px-1.5 py-0.5">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px] px-1.5 py-0.5">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.is_active && (
                        <TableCell className="px-2 py-1.5">
                          {item.is_active === 1 ? (
                            <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[10px] px-1.5 py-0.5">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px] px-1.5 py-0.5">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.start_date && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {item.start_date ? formatWIBDate(item.start_date) : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.end_date && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {item.end_date ? formatWIBDate(item.end_date) : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.editedBy && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[120px]" title={item.editedBy || "-"}>
                          {item.editedBy || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/daily-benefit/view/${item.id}`}>
                                <DropdownMenuItem className="text-xs h-8">
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/daily-benefit/edit/${item.id}`}>
                                <DropdownMenuItem className="text-xs h-8">
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
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
                      No daily benefit items found.
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 items-start">
                    <Skeleton className="h-16 w-12 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 items-start">
                    <Skeleton className="h-16 w-12 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 items-start">
                    <div className="h-20 w-16 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                          (e.target as HTMLImageElement).className = "h-6 w-auto object-contain brightness-95";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[11px] font-semibold text-gray-900 truncate">{item.name}</h3>
                          <p className="text-[11px] font-semibold text-[#E5262C] mt-0.5">{item.redeem_point} pts</p>
                        </div>
                        {item.status === 1 ? (
                          <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[10px] px-1.5 py-0.5 shrink-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px] px-1.5 py-0.5 shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 truncate">Edited by: {item.editedBy || "-"}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => router.push(`/daily-benefit/view/${item.id}`)}
                          variant="outline"
                          size="sm"
                          className="min-h-[32px] px-2 h-8"
                          aria-label="View"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Link href={`/daily-benefit/edit/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[32px] px-2 h-8 border-[#E5262C]/30 text-[#E5262C] hover:bg-[#E5262C]/5"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => setDeleteItem(item)}
                          variant="destructive"
                          size="sm"
                          className="min-h-[32px] px-2 h-8"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-sm text-gray-500">No daily benefit items found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalCount={totalCount}
              pageSize={50}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Alert Dialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Daily Benefit"
        itemName={deleteItem?.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewItem}
        onOpenChange={() => setPreviewItem(null)}
        imageUrl={previewItem?.image_url}
        alt={previewItem?.name || "Daily Benefit image preview"}
      />
    </div>
  );
}
