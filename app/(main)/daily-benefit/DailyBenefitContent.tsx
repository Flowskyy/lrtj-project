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
import { ScrollArea } from "@/components/ui/scroll-area";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import ImageUpload from "@/components/ImageUpload";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import RichTextContentField from "@/components/RichTextContentField";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Filter, Plus, MoreVertical, Eye, Pencil, Trash2, Search, Columns, ChevronDown, Check, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import Link from "next/link";
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
  username: string;
}

export default function DailyBenefitContent({ username }: DailyBenefitContentProps) {
  const [items, setItems] = useState<DailyBenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<DailyBenefitItem | null>(null);
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
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);

      const res = await fetch(`/api/daily-benefit?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setActiveCount(response.meta?.active || 0);
        setInactiveCount(response.meta?.inactive || 0);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, sortBy, sortOrder]);

  // Debounced search
  const { handleSearchChange } = useDebouncedSearch({ delay: 300 });

  const onSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    handleSearchChange(() => {
      // Search filtering is done client-side via filteredItems
    });
  }, [handleSearchChange]);

  // Filter items based on search query (memoized for performance)
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.editedBy?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Daily Benefits
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalBenefits}
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Active
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {loading ? "..." : active}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-700"
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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-gray-500 mt-1">
                  {loading ? "..." : inactive}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-gray-500"
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
      <Card>
        <CardContent>
          <CardHeader className="p-3">
            <div className="flex flex-wrap items-center justify-between">
              <CardTitle className="text-lg">Daily Benefit Management</CardTitle>
              <Link href="/daily-benefit/add">
                <Button className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Daily Benefit
                </Button>
              </Link>
            </div>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search daily benefits..."
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
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px]">
                  <Columns className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, image: !prev.image }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.image && <Check className="h-4 w-4" />}
                      <span>Image</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, name: !prev.name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.name && <Check className="h-4 w-4" />}
                      <span>Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, points: !prev.points }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.points && <Check className="h-4 w-4" />}
                      <span>Points</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, status: !prev.status }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.status && <Check className="h-4 w-4" />}
                      <span>Status</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, is_active: !prev.is_active }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.is_active && <Check className="h-4 w-4" />}
                      <span>Active</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, start_date: !prev.start_date }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.start_date && <Check className="h-4 w-4" />}
                      <span>Start Date</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, end_date: !prev.end_date }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.end_date && <Check className="h-4 w-4" />}
                      <span>End Date</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, editedBy: !prev.editedBy }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.editedBy && <Check className="h-4 w-4" />}
                      <span>Last Edited By</span>
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
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.image && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Image
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[100px] max-w-[140px]">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.points && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20">
                      <div className="flex items-center gap-1">
                        Points
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.is_active && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Active
                    </TableHead>
                  )}
                  {visibleColumns.start_date && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Start Date
                    </TableHead>
                  )}
                  {visibleColumns.end_date && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      End Date
                    </TableHead>
                  )}
                  {visibleColumns.editedBy && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[100px] max-w-[120px]">
                      Last Edited By
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-16">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-14 w-20 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-12" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-14 w-20 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-12" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-14 w-20 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-12" /></TableCell>}
                    </TableRow>
                  </>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.image && (
                        <TableCell className="px-3 py-1.5">
                          <div className="h-14 w-20 rounded bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
                            <img
                              src={getImageUrl(item.image_url)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                                (e.target as HTMLImageElement).className = "h-8 w-auto object-contain brightness-95";
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900 max-w-[140px]">
                          <span className="block truncate" title={item.name}>
                            {item.name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.points && (
                        <TableCell className="px-3 py-1.5 text-xs font-semibold text-[#E5262C]">
                          {item.redeem_point} pts
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-3 py-1.5">
                          {item.status === 1 ? (
                            <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.is_active && (
                        <TableCell className="px-3 py-1.5">
                          {item.is_active === 1 ? (
                            <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">
                              No
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.start_date && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.start_date ? item.start_date.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.end_date && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.end_date ? item.end_date.split('T')[0] : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.editedBy && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 truncate max-w-[140px]" title={item.editedBy || ""}>
                          {item.editedBy || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-3 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setViewItem(item);
                              }} className="text-xs h-8">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View
                              </DropdownMenuItem>
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
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <Skeleton className="h-14 w-20 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <Skeleton className="h-14 w-20 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <div className="h-14 w-20 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 flex-shrink-0 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                          (e.target as HTMLImageElement).className = "h-8 w-auto object-contain brightness-95";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                          <p className="text-xs font-semibold text-[#E5262C] mt-0.5">{item.redeem_point} pts</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewItem(item)} className="text-xs h-8">
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              View
                            </DropdownMenuItem>
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
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.status === 1 ? (
                          <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                        {item.is_active === 1 ? (
                          <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <div>Start: {item.start_date ? item.start_date.split('T')[0] : "-"}</div>
                        <div>End: {item.end_date ? item.end_date.split('T')[0] : "-"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
                <p className="text-xs text-gray-400">No daily benefit items found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-md sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle>{viewItem?.name}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="overflow-y-auto space-y-4 rounded-b-xl">
              <div className="flex gap-4 items-start">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={`/${viewItem.image_url}`}
                    alt={viewItem.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                      (e.target as HTMLImageElement).className = "h-10 w-auto object-contain";
                    }}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="font-bold text-gray-900 text-base sm:text-lg">{viewItem.name}</div>
                  <div className="text-[#E5262C] font-bold text-sm sm:text-base">{viewItem.redeem_point} Points</div>
                  <div>
                    {viewItem.status === 1 ? (
                      <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Edited by: {viewItem.editedBy || "-"}</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Terms & Condition
                </div>
                <div
                  className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4 leading-relaxed [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: viewItem.term_condition }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Start Date
                  </span>
                  {viewItem.start_date ? viewItem.start_date.split('T')[0] : "-"}
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    End Date
                  </span>
                  {viewItem.end_date ? viewItem.end_date.split('T')[0] : "-"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Is Active
                  </span>
                  {viewItem.is_active === 1 ? "Yes" : "No"}
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Created
                  </span>
                  {viewItem.created_at ? viewItem.created_at.split('T')[0] : "-"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Updated
                  </span>
                  {viewItem.updated_at ? viewItem.updated_at.split('T')[0] : "-"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4">
            {viewItem && (
              <Link href={`/daily-benefit/edit/${viewItem.id}`}>
                <Button
                  onClick={() => setViewItem(null)}
                  variant="outline"
                  className="min-h-[44px] border-primary/30 text-primary hover:bg-primary/5"
                >
                  Edit
                </Button>
              </Link>
            )}
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
