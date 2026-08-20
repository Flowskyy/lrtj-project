"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModuleToolbar from "@/components/ModuleToolbar";
import ImageUpload from "@/components/ImageUpload";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import { getImageUrl } from "@/lib/utils";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { MoreVertical, Eye, Pencil, Trash2, ChevronDown } from "lucide-react";
import Pagination from "@/components/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MerchandiseItem {
  id: number;
  editedBy?: string;
  display_email?: string;
  name: string;
  image_url: string;
  points: number;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
  category_id: number | null;
  merchandise_category?: {
    id: number;
    category_name: string | null;
  } | null;
}

interface Category {
  id: number;
  category_name: string | null;
}

interface MerchandiseContentProps {
  // No props needed anymore
}

export default function MerchandiseContent({ }: MerchandiseContentProps) {
  const router = useRouter();
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal and CRUD states
  const [deleteItem, setDeleteItem] = useState<MerchandiseItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MerchandiseItem | null>(null);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    name: true,
    category: true,
    points: true,
    status: true,
    editedBy: true,
    actions: true,
  });

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      if (categoryFilter !== "all") params.set("category_id", categoryFilter);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/merchandise?${params}`);
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
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [sortBy, sortOrder, categoryFilter, currentPage]);

  // Search scopes for Merchandise
  const merchandiseSearchScopes: SearchScope[] = [
    { field: "editedBy", label: "Last Edited By" },
    { field: "name", label: "Merchandise Name" },
  ];

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

  // Filter items based on search query and scope (client-side for now, can be moved to server)
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    if (searchScope === 'editedBy') {
      return item.editedBy?.toLowerCase().includes(query) || item.display_email?.toLowerCase().includes(query);
    } else if (searchScope === 'name') {
      return item.name.toLowerCase().includes(query);
    } else {
      // Default: search both name and editedBy
      return item.name.toLowerCase().includes(query) ||
             item.editedBy?.toLowerCase().includes(query) ||
             item.display_email?.toLowerCase().includes(query);
    }
  });

  const activeFilterCount = (searchQuery ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchScope("");
    setCategoryFilter("all");
    setSortBy("createdAt");
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
      const res = await fetch(`/api/merchandise/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("Merchandise deleted successfully");
      } else {
        toast.error("Failed to delete merchandise");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete merchandise");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed values
  const totalMerchandise = totalCount;
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
                  Total Merchandise
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalMerchandise}
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
            <h2 className="text-xl font-semibold text-gray-900">Merchandise Management</h2>
          </div>

          {/* Table Toolbar */}
          <ModuleToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search merchandise..."
            searchScopes={merchandiseSearchScopes}
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
              { value: "createdAt", label: "Created Date" },
              { value: "name", label: "Name" },
              { value: "points", label: "Points" },
            ]}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            categoryOptions={[
              { value: "all", label: "All Categories" },
              { value: "uncategorized", label: "No Category" },
              ...categories.map(cat => ({ value: cat.id.toString(), label: cat.category_name || `Category ${cat.id}` }))
            ]}
            showCategoryFilter={true}
            onResetFilters={handleResetFilters}
            activeFilterCount={activeFilterCount}
            visibleColumns={visibleColumns}
            onColumnVisibilityToggle={(key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            columnConfigs={[
              { key: "image", label: "Image" },
              { key: "name", label: "Name" },
              { key: "category", label: "Category" },
              { key: "points", label: "Points" },
              { key: "status", label: "Status" },
              { key: "editedBy", label: "Last Edited By" },
              { key: "actions", label: "Actions" },
            ]}
            primaryAction={{
              label: "Add Merchandise",
              href: "/merchandise/add",
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
                  {visibleColumns.name && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[100px] max-w-[140px]">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronDown className="h-2.5 w-2.5" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.category && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[100px] max-w-[140px]">
                      Category
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
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-20 w-28 rounded-lg" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-20 w-28 rounded-lg" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.category && <TableCell><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-3 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
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
                      {visibleColumns.category && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[140px]" title={item.merchandise_category?.category_name || "Uncategorized"}>
                          {item.merchandise_category?.category_name || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.points && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-semibold text-[#E5262C]">
                          {item.points} pts
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
                      {visibleColumns.editedBy && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[140px]" title={item.display_email || ""}>
                          {item.display_email || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/merchandise/view/${item.id}`)} className="text-[10px] h-6">
                                <Eye className="h-3 w-3 mr-2" />
                                View
                              </DropdownMenuItem>
                              <Link href={`/merchandise/edit/${item.id}`}>
                                <DropdownMenuItem className="text-[10px] h-6">
                                  <Pencil className="h-3 w-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
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
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-2 py-8 text-center text-[11px] text-gray-500">
                      No merchandise items found.
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
                          <p className="text-[11px] font-semibold text-[#E5262C] mt-0.5">{item.points} pts</p>
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
                      <p className="text-[10px] text-gray-500 mt-1 truncate">Edited by: {item.display_email || "-"}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => router.push(`/merchandise/view/${item.id}`)}
                          variant="outline"
                          size="sm"
                          className="min-h-[32px] px-2 h-8"
                          aria-label="View"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Link href={`/merchandise/edit/${item.id}`}>
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
                <p className="text-sm text-gray-500">No merchandise items found.</p>
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

      {/* MODAL: DELETE */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Delete Merchandise"
        itemName={deleteItem?.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={!!previewItem}
        onOpenChange={() => setPreviewItem(null)}
        imageUrl={previewItem?.image_url}
        alt={previewItem?.name || "Merchandise image preview"}
      />
    </div>
  );
}
