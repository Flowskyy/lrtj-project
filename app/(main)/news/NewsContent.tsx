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
import RichTextEditor from "@/components/RichTextEditor";
import { Filter, Plus, MoreVertical, Eye, Pencil, Trash2, Search, Columns, ChevronDown, Check, X, Calendar } from "lucide-react";
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
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<NewsItem | null>(null);
  const [editItem, setEditItem] = useState<NewsItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<NewsItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCaptionImage, setFormCaptionImage] = useState("");
  const [formType, setFormType] = useState("general");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [formPublishDate, setFormPublishDate] = useState("");

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
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.createdBy?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetForm = () => {
    setFormTitle("");
    setFormTitleEn("");
    setFormContent("");
    setFormContentEn("");
    setFormImageUrl("");
    setFormCaptionImage("");
    setFormType("general");
    setFormStatus(1);
    setFormPublishDate("");
  };

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          title_en: formTitleEn,
          content: formContent,
          content_en: formContentEn,
          img_url: formImageUrl,
          caption_image: formCaptionImage,
          type: formType,
          status: formStatus,
          publish_date: formPublishDate || null,
          createdBy: username,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setIsAdding(false);
        resetForm();
        toast.success("News added successfully");
      } else {
        toast.error("Failed to add news");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add news");
    }
  };

  // Edit Item
  const openEdit = (item: NewsItem) => {
    setEditItem(item);
    setFormTitle(item.title || "");
    setFormTitleEn(item.title_en || "");
    setFormContent(item.content || "");
    setFormContentEn(item.content_en || "");
    setFormImageUrl(item.img_url || "");
    setFormCaptionImage(item.caption_image || "");
    setFormType(item.type || "general");
    setFormStatus(item.status);
    setFormPublishDate(item.publish_date ? new Date(item.publish_date).toISOString().split('T')[0] : "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`/api/news/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          title_en: formTitleEn,
          content: formContent,
          content_en: formContentEn,
          img_url: formImageUrl,
          caption_image: formCaptionImage,
          type: formType,
          status: formStatus,
          publish_date: formPublishDate || null,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setEditItem(null);
        resetForm();
        toast.success("News updated successfully");
      } else {
        toast.error("Failed to update news");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update news");
    }
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
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
    item?: NewsItem | null;
  }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Title *
            </label>
            <Input
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter news title"
              className="min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Title (English)
            </label>
            <Input
              value={formTitleEn}
              onChange={(e) => setFormTitleEn(e.target.value)}
              placeholder="Enter news title in English"
              className="min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                Type
              </label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
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
              Publish Date
            </label>
            <Input
              type="date"
              value={formPublishDate}
              onChange={(e) => setFormPublishDate(e.target.value)}
              className="min-h-[44px]"
            />
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
              Image Caption
            </label>
            <Input
              value={formCaptionImage}
              onChange={(e) => setFormCaptionImage(e.target.value)}
              placeholder="Image caption/alt text"
              className="min-h-[44px]"
            />
          </div>
          <div>
            <RichTextEditor
              value={formContent}
              onChange={setFormContent}
              label="Content (Indonesian)"
            />
          </div>
          <div>
            <RichTextEditor
              value={formContentEn}
              onChange={setFormContentEn}
              label="Content (English)"
            />
          </div>
          {isEdit && item && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Views
                </label>
                <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
                  {item.views.toString()}
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Created
                </label>
                <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
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
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total News
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
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
        <CardContent className="p-4">
          <CardHeader className="p-3">
            <div className="flex flex-wrap items-center justify-between">
              <CardTitle className="text-lg">News Management</CardTitle>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="min-h-[44px] bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add News
              </Button>
            </div>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 min-h-[44px] w-full sm:w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, title: !prev.title }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.title && <Check className="h-4 w-4" />}
                      <span>Title</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, type: !prev.type }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.type && <Check className="h-4 w-4" />}
                      <span>Type</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, status: !prev.status }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.status && <Check className="h-4 w-4" />}
                      <span>Status</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, publish_date: !prev.publish_date }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.publish_date && <Check className="h-4 w-4" />}
                      <span>Publish Date</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, views: !prev.views }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.views && <Check className="h-4 w-4" />}
                      <span>Views</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, createdBy: !prev.createdBy }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.createdBy && <Check className="h-4 w-4" />}
                      <span>Created By</span>
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
                  {visibleColumns.title && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Title
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.type && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.publish_date && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Publish Date
                    </TableHead>
                  )}
                  {visibleColumns.views && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Views
                    </TableHead>
                  )}
                  {visibleColumns.createdBy && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Created By
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
                      {visibleColumns.title && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>}
                      {visibleColumns.title && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>}
                      {visibleColumns.title && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.type && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.publish_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.views && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.createdBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
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
                              src={`/${item.img_url}`}
                              alt={item.title || "News"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                                (e.target as HTMLImageElement).className = "h-4 w-auto object-contain brightness-95";
                              }}
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.title && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900 max-w-[240px]">
                          <span className="block truncate" title={item.title || item.title_en || ""}>
                            {item.title || item.title_en || "-"}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell className="px-3 py-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.type || "general"}
                          </Badge>
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
                      {visibleColumns.publish_date && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.views && (
                        <TableCell className="px-3 py-1.5 text-xs font-semibold text-gray-700">
                          {item.views.toString()}
                        </TableCell>
                      )}
                      {visibleColumns.createdBy && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 truncate max-w-[140px]" title={item.createdBy || ""}>
                          {item.createdBy || "-"}
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
                    <div className="h-14 w-14 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 flex-shrink-0">
                      <img
                        src={`/${item.img_url}`}
                        alt={item.title || "News"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo-lrtj.png";
                          (e.target as HTMLImageElement).className = "h-6 w-auto object-contain brightness-95";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {item.title || item.title_en || "-"}
                        </h3>
                        {item.status === 1 ? (
                          <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 text-[10px] shrink-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {item.type || "general"}
                        </Badge>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : "-"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {item.views.toString()} views
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewItem(item)}
                          className="flex-1 min-h-[36px] text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                          className="flex-1 min-h-[36px] text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteItem(item)}
                          className="flex-1 min-h-[36px] text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
                <p className="text-xs text-gray-400">No news items found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={(open) => !open && setIsAdding(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {renderModalForm({
            title: "Add News",
            onClose: () => setIsAdding(false),
            onSubmit: handleAdd,
          })}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {editItem && renderModalForm({
            title: "Edit News",
            onClose: () => setEditItem(null),
            onSubmit: handleEdit,
            isEdit: true,
            item: editItem,
          })}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle>News Details</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {viewItem.img_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={`/${viewItem.img_url}`}
                        alt={viewItem.title || "News"}
                        className="w-full h-auto object-cover"
                      />
                      {viewItem.caption_image && (
                        <p className="text-xs text-gray-500 mt-2 italic">{viewItem.caption_image}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Title (Indonesian)</h3>
                    <p className="text-sm text-gray-700">{viewItem.title || "-"}</p>
                  </div>
                  {viewItem.title_en && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Title (English)</h3>
                      <p className="text-sm text-gray-700">{viewItem.title_en}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Type</h3>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {viewItem.type || "general"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Status</h3>
                      {viewItem.status === 1 ? (
                        <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Publish Date</h3>
                      <p className="text-sm text-gray-700">{viewItem.publish_date ? new Date(viewItem.publish_date).toLocaleDateString() : "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Views</h3>
                      <p className="text-sm text-gray-700">{viewItem.views.toString()}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Created By</h3>
                    <p className="text-sm text-gray-700">{viewItem.createdBy || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Content (Indonesian)</h3>
                    <div 
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewItem.content || "-" }}
                    />
                  </div>
                  {viewItem.content_en && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Content (English)</h3>
                      <div 
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: viewItem.content_en }}
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.title || deleteItem?.title_en || 'this news item'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="min-h-[44px] bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
