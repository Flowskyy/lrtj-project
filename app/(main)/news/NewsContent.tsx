"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModuleToolbar from "@/components/ModuleToolbar";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { getImageUrl } from "@/lib/utils";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import { formatDisplayDate } from "@/lib/formatWIBDate";
import { MoreVertical, Eye, Pencil, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewsItem {
  id: number;
  createdBy?: string;
  creatorEmail?: string | null;
  img_url?: string;
  caption_image?: string;
  views: bigint;
  title?: string;
  title_en?: string;
  type?: string;
  content?: string;
  content_en?: string;
  created_at: string | null;
  updated_at: string | null;
  publish_date: string | null;
  status: number;
}

interface NewsContentProps {
  username: string;
}

export default function NewsContent({ username }: NewsContentProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal and CRUD states
  const [deleteItem, setDeleteItem] = useState<NewsItem | null>(null);
  const [previewItem, setPreviewItem] = useState<NewsItem | null>(null);


  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    title: true,
    type: true,
    status: true,
    publish_date: true,
    views: true,
    createdBy: true,
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

      const res = await fetch(`/api/news?${params}`);
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

  // Search scopes for News
  const newsSearchScopes: SearchScope[] = [
    { field: "createdBy", label: "Created By" },
    { field: "title", label: "News Title" },
  ];

  // Handle scope selection
  const handleScopeSelect = (scope: SearchScope) => {
    setSearchScope(scope.field);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchScope("");
    setShowScopeSuggestions(false);
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  // Active filter count
  const activeFilterCount = (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  // Handle column visibility toggle
  const handleColumnVisibilityToggle = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // Filter items based on search query and scope (client-side for now, can be moved to server)
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    if (searchScope === 'createdBy') {
      return item.createdBy?.toLowerCase().includes(query) || item.creatorEmail?.toLowerCase().includes(query);
    } else if (searchScope === 'title') {
      return item.title?.toLowerCase().includes(query) || item.title_en?.toLowerCase().includes(query);
    } else {
      // Default: search both title and createdBy
      return item.title?.toLowerCase().includes(query) ||
             item.title_en?.toLowerCase().includes(query) ||
             item.createdBy?.toLowerCase().includes(query) ||
             item.creatorEmail?.toLowerCase().includes(query);
    }
  });

  // Handle search input change
  const handleSearchChange = (value: string) => {
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

  // Delete Item
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/news/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("News deleted successfully");
      } else {
        toast.error("Failed to delete news");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete news");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to check if HTML content is actually empty
  const isHtmlContentEmpty = (html: string | undefined | null): boolean => {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text === '' || text === '-';
  };

  // Computed values
  const totalNews = totalCount;
  const active = activeCount;
  const inactive = inactiveCount;


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total News
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : totalNews}
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
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
                  Active
                </p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {loading ? "..." : active}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-700"
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Inactive
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : inactive}
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
        <CardContent>
          <CardHeader className="p-3">
            <CardTitle className="text-lg">News Management</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <ModuleToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search news..."
            searchScopes={newsSearchScopes}
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
              { value: "created_at", label: "Created Date" },
              { value: "publish_date", label: "Publish Date" },
              { value: "title", label: "Title" },
            ]}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            showStatusFilter={true}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeOptions={[
              { value: "all", label: "All" },
              { value: "news", label: "News" },
              { value: "pers", label: "Press Release" },
            ]}
            showTypeFilter={true}
            onResetFilters={handleResetFilters}
            activeFilterCount={activeFilterCount}
            visibleColumns={visibleColumns}
            onColumnVisibilityToggle={handleColumnVisibilityToggle}
            columnConfigs={[
              { key: "image", label: "Image" },
              { key: "title", label: "Title" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status" },
              { key: "publish_date", label: "Publish Date" },
              { key: "views", label: "Views" },
              { key: "createdBy", label: "Created By" },
              { key: "actions", label: "Actions" },
            ]}
            primaryAction={{
              label: "Add News",
              href: "/news/add",
            }}
          />

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
                  {visibleColumns.title && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[100px] max-w-[140px]">
                      <div className="flex items-center gap-1">
                        Title
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.type && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Type
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.publish_date && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      Publish Date
                    </TableHead>
                  )}
                  {visibleColumns.views && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Views
                    </TableHead>
                  )}
                  {visibleColumns.createdBy && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[100px] max-w-[120px]">
                      Created By
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
                      {visibleColumns.image && <TableCell><Skeleton className="aspect-video w-28 rounded" /></TableCell>}
                      {visibleColumns.title && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="aspect-video w-28 rounded" /></TableCell>}
                      {visibleColumns.title && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="aspect-video w-28 rounded" /></TableCell>}
                      {visibleColumns.title && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-3 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
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
                              src={getImageUrl(item.img_url)}
                              alt={item.title || "News"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                                (e.target as HTMLImageElement).className = "h-6 w-auto object-contain brightness-95";
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.title && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900 max-w-[140px]">
                          <span className="block truncate" title={item.title || item.title_en || ""}>
                            {item.title || item.title_en || "-"}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell className="px-2 py-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.type || "general"}
                          </Badge>
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
                      {visibleColumns.publish_date && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {formatDisplayDate(item.publish_date)}
                        </TableCell>
                      )}
                      {visibleColumns.views && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-semibold text-gray-700">
                          {item.views.toString()}
                        </TableCell>
                      )}
                      {visibleColumns.createdBy && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[140px]" title={item.createdBy || ""}>
                          {item.createdBy || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/news/view/${item.id}`}>
                                <DropdownMenuItem className="text-xs h-8">
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/news/edit/${item.id}`}>
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
                      No news items found.
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
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex gap-2 items-start">
                    <Skeleton className="h-20 w-16 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-3 w-32" />
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
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex gap-2 items-start">
                    <Skeleton className="h-20 w-16 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-3 w-32" />
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
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex gap-2 items-start">
                    <div className="h-20 w-16 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
                      <img
                        src={getImageUrl(item.img_url)}
                        alt={item.title || "News"}
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
                          <h3 className="text-[11px] font-semibold text-gray-900 truncate">{item.title || item.title_en || "-"}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.views.toString()} views</p>
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
                      <p className="text-[10px] text-gray-500 mt-1 truncate">Created by: {item.createdBy || "-"}</p>
                      <div className="flex gap-2 mt-2">
                        <Link href={`/news/view/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[32px] px-2 h-8"
                            aria-label="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/news/edit/${item.id}`}>
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
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteItem(item)}
                          className="min-h-[32px] px-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
                <p className="text-xs text-gray-400">No news items found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete News"
        description={`Are you sure you want to delete "${deleteItem?.title || deleteItem?.title_en || 'this news item'}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewItem}
        onOpenChange={() => setPreviewItem(null)}
        imageUrl={previewItem?.img_url}
        alt={previewItem?.title || "News image preview"}
      />
    </div>
  );
}
