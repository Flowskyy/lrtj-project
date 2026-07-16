"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import FilterSheet from "@/components/FilterSheet";
import { Filter, Plus, MoreVertical, Eye, Pencil, Trash2, Search, Columns, ChevronDown, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MerchandiseItem {
  id: number;
  editedBy?: string;
  creator_email?: string;
  name: string;
  image_url: string;
  points: number;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
}

interface MerchandiseContentProps {
  username: string;
}

export default function MerchandiseContent({ username }: MerchandiseContentProps) {
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<MerchandiseItem | null>(null);
  const [editItem, setEditItem] = useState<MerchandiseItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MerchandiseItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    name: true,
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
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);

      const res = await fetch(`/api/merchandise?${params}`);
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
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      // Search filtering is done client-side via filteredItems
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Filter items based on search query (memoized for performance)
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.editedBy?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetForm = () => {
    setFormName("");
    setFormPoints(100);
    setFormImageUrl("");
    setFormDescription("");
    setFormStatus(1);
  };

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          points: formPoints,
          image_url: formImageUrl,
          description: formDescription,
          editedBy: username,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setIsAdding(false);
        resetForm();
        toast.success("Merchandise added successfully");
      } else {
        toast.error("Failed to add merchandise");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add merchandise");
    }
  };

  // Edit Item
  const openEdit = (item: MerchandiseItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormPoints(item.points);
    setFormImageUrl(item.image_url);
    setFormDescription(item.description);
    setFormStatus(item.status);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`/api/merchandise/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          points: formPoints,
          image_url: formImageUrl,
          description: formDescription,
          editedBy: username,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setEditItem(null);
        resetForm();
        toast.success("Merchandise updated successfully");
      } else {
        toast.error("Failed to update merchandise");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update merchandise");
    }
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
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
    }
  };

  // Computed values
  const total = totalCount;
  const active = activeCount;
  const inactive = inactiveCount;

  // Render modal form content (without Dialog wrapper)
  const renderModalForm = ({
    title,
    onClose,
    onSubmit,
    isEdit = false,
    item = null,
  }: {
    title: string;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isEdit?: boolean;
    item?: MerchandiseItem | null;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Name *
            </label>
            <Input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter merchandise name"
              className="min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                Points *
              </label>
              <Input
                required
                type="number"
                min={0}
                value={formPoints}
                onChange={(e) => setFormPoints(parseInt(e.target.value) || 0)}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                Status
              </label>
              <Select value={formStatus.toString()} onValueChange={(v) => setFormStatus(parseInt(v || '1'))}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Image Path
            </label>
            <Input
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="storage/2024/..."
              className="min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Terms & Condition (HTML)
            </label>
            <ScrollArea className="h-32 w-full border border-gray-200 rounded-lg">
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 min-h-[100px] resize-none"
              />
            </ScrollArea>
          </div>
          {isEdit && item && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Created
                </label>
                <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Updated
                </label>
                <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
            Save
          </Button>
        </DialogFooter>
      </form>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Merchandise
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : total}
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
          <CardContent className="p-4">
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
          <CardContent className="p-4">
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
        <CardContent className="p-4">
          <CardHeader className="px-0 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-lg">Merchandise Management</CardTitle>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="min-h-[44px] bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Merchandise
              </Button>
            </div>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search merchandise..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 min-h-[44px] w-full sm:w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] relative"
                onClick={() => setFilterSheetOpen(true)}
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-white text-[10px] p-0 rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
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

          {/* Filter Sheet */}
          <FilterSheet
            open={filterSheetOpen}
            onOpenChange={setFilterSheetOpen}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.image && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Image
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Name
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.points && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Points
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.editedBy && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Last Edited By
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
                      {visibleColumns.image && <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.image && (
                        <TableCell className="px-3 py-1.5">
                          <div className="h-8 w-8 rounded bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100">
                            <img
                              src={`/${item.image_url}`}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                                (e.target as HTMLImageElement).className = "h-4 w-auto object-contain brightness-95";
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900 max-w-[240px]">
                          <span className="block truncate" title={item.name}>
                            {item.name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.points && (
                        <TableCell className="px-3 py-1.5 text-xs font-semibold text-[#E5262C]">
                          {item.points} pts
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
                              <DropdownMenuItem onClick={() => openEdit(item)} className="text-xs h-8">
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit
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
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <Skeleton className="h-14 w-14 rounded-lg" />
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
                    <Skeleton className="h-14 w-14 rounded-lg" />
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
                    <div className="h-14 w-14 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 shrink-0">
                      <img
                        src={`/${item.image_url}`}
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
                          <p className="text-sm font-semibold text-[#E5262C] mt-0.5">{item.points} pts</p>
                        </div>
                        {item.status === 1 ? (
                          <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px] px-2 py-0.5 shrink-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px] px-2 py-0.5 shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">Edited by: {item.editedBy || "-"}</p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => {
                            setViewItem(item);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[44px]"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          onClick={() => openEdit(item)}
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[44px] border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteItem(item)}
                          variant="destructive"
                          size="sm"
                          className="flex-1 min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No merchandise items found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL: VIEW */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.name}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="overflow-y-auto space-y-4">
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
                  <div className="text-[#E5262C] font-bold text-sm sm:text-base">{viewItem.points} Points</div>
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
                  dangerouslySetInnerHTML={{ __html: viewItem.description }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Created
                  </span>
                  {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleDateString() : "-"}
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Updated
                  </span>
                  {viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setViewItem(null);
                if (viewItem) openEdit(viewItem);
              }}
              variant="outline"
              className="min-h-[44px] border-primary/30 text-primary hover:bg-primary/5"
            >
              Edit
            </Button>
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

      {/* MODAL: ADD */}
      <Dialog open={isAdding} onOpenChange={(open) => {
        if (!open) {
          setIsAdding(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          {renderModalForm({
            title: "Add Merchandise",
            onClose: () => {
              setIsAdding(false);
              resetForm();
            },
            onSubmit: handleAdd,
          })}
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT */}
      <Dialog open={!!editItem} onOpenChange={(open) => {
        if (!open) {
          setEditItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          {editItem && renderModalForm({
            title: `Edit – ${editItem.name}`,
            onClose: () => {
              setEditItem(null);
              resetForm();
            },
            onSubmit: handleEdit,
            isEdit: true,
            item: editItem,
          })}
        </DialogContent>
      </Dialog>

      {/* MODAL: DELETE */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Merchandise</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem && (
                <>Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteItem.name}"</span>? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="min-h-[44px] bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
