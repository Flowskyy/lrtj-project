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
import ImageUpload from "@/components/ImageUpload";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { Filter, Plus, MoreVertical, Eye, Pencil, Trash2, Search, Columns, ChevronDown, Check, X } from "lucide-react";
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<DailyBenefitItem | null>(null);
  const [editItem, setEditItem] = useState<DailyBenefitItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DailyBenefitItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [previewItem, setPreviewItem] = useState<DailyBenefitItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTermCondition, setFormTermCondition] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState<number>(1);

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
    setFormTermCondition("");
    setFormStatus(1);
    setFormStartDate("");
    setFormEndDate("");
    setFormIsActive(1);
  };

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/daily-benefit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          redeem_point: formPoints,
          image_url: formImageUrl,
          term_condition: formTermCondition,
          editedBy: username,
          status: formStatus,
          start_date: formStartDate || null,
          end_date: formEndDate || null,
          is_active: formIsActive,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setIsAdding(false);
        resetForm();
        toast.success("Daily Benefit added successfully");
      } else {
        toast.error("Failed to add daily benefit");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add daily benefit");
    }
  };

  // Edit Item
  const openEdit = (item: DailyBenefitItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormPoints(item.redeem_point);
    setFormImageUrl(item.image_url);
    setFormTermCondition(item.term_condition);
    setFormStatus(item.status);
    setFormStartDate(item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "");
    setFormEndDate(item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "");
    setFormIsActive(item.is_active ?? 1);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`/api/daily-benefit/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          redeem_point: formPoints,
          image_url: formImageUrl,
          term_condition: formTermCondition,
          editedBy: username,
          status: formStatus,
          start_date: formStartDate || null,
          end_date: formEndDate || null,
          is_active: formIsActive,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setEditItem(null);
        resetForm();
        toast.success("Daily Benefit updated successfully");
      } else {
        toast.error("Failed to update daily benefit");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update daily benefit");
    }
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
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
    }
  };

  // Computed values
  const total = totalCount;
  const active = activeCount;
  const inactive = inactiveCount;

  // Render form fields (shared between Add and Edit dialogs)
  const renderFormFields = () => (
    <>
      <div>
        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
          Name *
        </label>
        <Input
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Enter daily benefit name"
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
      <ImageUpload
        value={formImageUrl}
        onChange={setFormImageUrl}
        label="Image"
      />
      <div>
        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
          Terms & Condition (HTML)
        </label>
        <ScrollArea className="h-32 w-full border border-gray-200 rounded-lg">
          <textarea
            rows={4}
            value={formTermCondition}
            onChange={(e) => setFormTermCondition(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 min-h-[100px] resize-none"
          />
        </ScrollArea>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
            Start Date
          </label>
          <Input
            type="date"
            value={formStartDate}
            onChange={(e) => setFormStartDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
            End Date
          </label>
          <Input
            type="date"
            value={formEndDate}
            onChange={(e) => setFormEndDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
          Is Active
        </label>
        <Select value={formIsActive.toString()} onValueChange={(v) => setFormIsActive(parseInt(v || '1'))}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Yes</SelectItem>
            <SelectItem value="0">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {editItem && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Created
            </label>
            <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
              {editItem.created_at ? new Date(editItem.created_at).toLocaleDateString() : "-"}
            </div>
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
              Updated
            </label>
            <div className="min-h-[44px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600">
              {editItem.updated_at ? new Date(editItem.updated_at).toLocaleDateString() : "-"}
            </div>
          </div>
        </div>
      )}
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
                  Total Daily Benefits
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
              <CardTitle className="text-lg">Daily Benefit Management</CardTitle>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="min-h-[44px] bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Benefit
              </Button>
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
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
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
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-32">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-32 w-40 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-32 w-40 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.image && <TableCell><Skeleton className="h-32 w-40 rounded" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.points && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.is_active && <TableCell><Skeleton className="h-5 w-16" /></TableCell>}
                      {visibleColumns.start_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.end_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.editedBy && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.image && (
                        <TableCell className="px-3 py-1.5">
                          <div className="h-32 w-40 rounded bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
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
                          {item.start_date ? new Date(item.start_date).toLocaleDateString() : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.end_date && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.end_date ? new Date(item.end_date).toLocaleDateString() : "-"}
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
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <Skeleton className="h-32 w-24 rounded-lg" />
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
                    <Skeleton className="h-32 w-24 rounded-lg" />
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
                    <div className="h-32 w-24 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 flex-shrink-0 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setPreviewItem(item)}>
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
                        <div>Start: {item.start_date ? new Date(item.start_date).toLocaleDateString() : "-"}</div>
                        <div>End: {item.end_date ? new Date(item.end_date).toLocaleDateString() : "-"}</div>
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

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add Daily Benefit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto space-y-3 sm:space-y-4">
              {renderFormFields()}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); resetForm(); }} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Daily Benefit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto space-y-3 sm:space-y-4">
              {renderFormFields()}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setEditItem(null); resetForm(); }} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto overflow-hidden">
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
                  {viewItem.start_date ? new Date(viewItem.start_date).toLocaleDateString() : "-"}
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    End Date
                  </span>
                  {viewItem.end_date ? new Date(viewItem.end_date).toLocaleDateString() : "-"}
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
                  {viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString() : "-"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div>
                  <span className="block text-[10px] sm:text-xs uppercase font-semibold text-gray-600 mb-0.5 tracking-wider">
                    Updated
                  </span>
                  {viewItem.updated_at ? new Date(viewItem.updated_at).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4">
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

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
