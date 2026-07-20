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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Filter, Plus, MoreVertical, Pencil, Trash2, Search, Columns, ChevronDown, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  created_at: string | null;
  updated_at: string | null;
}

interface RedeemMerchandiseContentProps {
  username: string;
}

export default function RedeemMerchandiseContent({ username }: RedeemMerchandiseContentProps) {
  const [items, setItems] = useState<RedeemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  

  // Modal and CRUD states
  const [editItem, setEditItem] = useState<RedeemItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RedeemItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formReceiverName, setFormReceiverName] = useState("");
  const [formReceiverPhone, setFormReceiverPhone] = useState("");
  const [formReceiverEmail, setFormReceiverEmail] = useState("");
  const [formReceiverAddress, setFormReceiverAddress] = useState("");
  const [formStatus, setFormStatus] = useState("process");
  const [formMerchandiseId, setFormMerchandiseId] = useState<number | null>(null);
  const [formUserId, setFormUserId] = useState<number | null>(null);
  const [merchandiseOptions, setMerchandiseOptions] = useState<{id: number, name: string}[]>([]);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    user_id: true,
    receiver_name: true,
    merchandise_name: true,
    status: true,
    created_at: true,
    updated_at: true,
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
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/redeem?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setPendingCount(response.meta?.pending || 0);
        setCompletedCount(response.meta?.completed || 0);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch merchandise options for dropdown
  const fetchMerchandiseOptions = async () => {
    try {
      const res = await fetch('/api/merchandise');
      if (res.ok) {
        const response = await res.json();
        setMerchandiseOptions(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch merchandise options", err);
    }
  };


  useEffect(() => {
    fetchItems();
  }, [statusFilter, sortBy, sortOrder, currentPage, searchQuery]);

  useEffect(() => {
    fetchMerchandiseOptions();
  }, []);

  // Count active filters
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const resetForm = () => {
    setFormReceiverName("");
    setFormReceiverPhone("");
    setFormReceiverEmail("");
    setFormReceiverAddress("");
    setFormStatus("process");
    setFormMerchandiseId(null);
    setFormUserId(null);
  };

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: formUserId,
          merchandise_id: formMerchandiseId,
          receiver_name: formReceiverName,
          receiver_phone: formReceiverPhone,
          receiver_email: formReceiverEmail,
          receiver_address: formReceiverAddress,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setIsAdding(false);
        resetForm();
        toast.success("Redeem record added successfully");
      } else {
        toast.error("Failed to add redeem record");
      }
    } catch (err) {
      console.error("Failed to add item", err);
      toast.error("Failed to add redeem record");
    }
  };

  // Edit Item
  const openEdit = (item: RedeemItem) => {
    setEditItem(item);
    setFormReceiverName(item.receiver_name);
    setFormReceiverPhone(item.receiver_phone);
    setFormReceiverEmail(item.receiver_email);
    setFormReceiverAddress(item.receiver_address);
    setFormStatus(item.status);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`/api/redeem/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_name: formReceiverName,
          receiver_phone: formReceiverPhone,
          receiver_email: formReceiverEmail,
          receiver_address: formReceiverAddress,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setEditItem(null);
        resetForm();
        toast.success("Redeem record updated successfully");
      } else {
        toast.error("Failed to update redeem record");
      }
    } catch (err) {
      console.error("Failed to edit item", err);
      toast.error("Failed to update redeem record");
    }
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
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
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") {
      return <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">{status}</Badge>;
    } else if (statusLower === "process" || statusLower === "pending") {
      return <Badge variant="default" className="bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 text-[10px]">{status}</Badge>;
    } else if (statusLower === "rejected") {
      return <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 text-[10px]">{status}</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">{status}</Badge>;
  };

  // Computed values
  const total = totalCount;
  const pending = pendingCount;
  const completed = completedCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Redeems
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : total}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">
                  {loading ? "..." : pending}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  Completed
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {loading ? "..." : completed}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
              <CardTitle className="text-lg">Redeem Merchandise</CardTitle>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="min-h-[44px] bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Redeem
              </Button>
            </div>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  <Input
                    type="text"
                    placeholder="Search redeems..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-8 min-h-[36px]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, id: !prev.id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.id && <Check className="h-4 w-4" />}
                      <span>ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, user_id: !prev.user_id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.user_id && <Check className="h-4 w-4" />}
                      <span>User ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, receiver_name: !prev.receiver_name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.receiver_name && <Check className="h-4 w-4" />}
                      <span>Receiver Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, merchandise_name: !prev.merchandise_name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.merchandise_name && <Check className="h-4 w-4" />}
                      <span>Merchandise</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, status: !prev.status }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.status && <Check className="h-4 w-4" />}
                      <span>Status</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, created_at: !prev.created_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.created_at && <Check className="h-4 w-4" />}
                      <span>Created</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, updated_at: !prev.updated_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.updated_at && <Check className="h-4 w-4" />}
                      <span>Updated</span>
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
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetContent side="right" className="w-full sm:w-80 p-0">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Status</label>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="process">Process</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Sort By</label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v || 'id')}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">ID</SelectItem>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="updated_at">Updated Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Order</label>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v || 'asc')}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <Button
                    onClick={() => setFilterSheetOpen(false)}
                    className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        ID
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.user_id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      User ID
                    </TableHead>
                  )}
                  {visibleColumns.receiver_name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Receiver Name
                    </TableHead>
                  )}
                  {visibleColumns.merchandise_name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Merchandise
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </TableHead>
                  )}
                  {visibleColumns.updated_at && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Updated
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
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.receiver_name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.merchandise_name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          #{item.id}
                        </TableCell>
                      )}
                      {visibleColumns.user_id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          {item.user_id}
                        </TableCell>
                      )}
                      {visibleColumns.receiver_name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900">
                          {item.receiver_name}
                        </TableCell>
                      )}
                      {visibleColumns.merchandise_name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900 max-w-[200px]">
                          <span className="block truncate" title={item.merchandise_name}>
                            {item.merchandise_name}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="px-3 py-1.5">
                          {getStatusBadge(item.status)}
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.updated_at && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-3 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                      No redeem records found.
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
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">#{item.id} – {item.merchandise_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">User ID: {item.user_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Receiver: {item.receiver_name}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No redeem records found.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[36px]"
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[36px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={() => setIsAdding(false)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>Add Redeem Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Receiver Name *
                </label>
                <Input
                  required
                  value={formReceiverName}
                  onChange={(e) => setFormReceiverName(e.target.value)}
                  placeholder="Enter receiver name"
                  className="min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    Receiver Phone *
                  </label>
                  <Input
                    required
                    value={formReceiverPhone}
                    onChange={(e) => setFormReceiverPhone(e.target.value)}
                    placeholder="Enter receiver phone"
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    Receiver Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formReceiverEmail}
                    onChange={(e) => setFormReceiverEmail(e.target.value)}
                    placeholder="Enter receiver email"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Receiver Address *
                </label>
                <textarea
                  required
                  value={formReceiverAddress}
                  onChange={(e) => setFormReceiverAddress(e.target.value)}
                  placeholder="Enter receiver address"
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 min-h-[80px] resize-y"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    Merchandise *
                  </label>
                  <Select value={formMerchandiseId?.toString() || ""} onValueChange={(v) => setFormMerchandiseId(v ? parseInt(v) : null)}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select merchandise" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchandiseOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    User ID *
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={formUserId || ""}
                    onChange={(e) => setFormUserId(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter user ID"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Status *
                </label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v || 'process')}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
                Add Redeem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>Edit Redeem Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Receiver Name *
                </label>
                <Input
                  required
                  value={formReceiverName}
                  onChange={(e) => setFormReceiverName(e.target.value)}
                  placeholder="Enter receiver name"
                  className="min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    Receiver Phone *
                  </label>
                  <Input
                    required
                    value={formReceiverPhone}
                    onChange={(e) => setFormReceiverPhone(e.target.value)}
                    placeholder="Enter receiver phone"
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                    Receiver Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formReceiverEmail}
                    onChange={(e) => setFormReceiverEmail(e.target.value)}
                    placeholder="Enter receiver email"
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Receiver Address *
                </label>
                <Input
                  required
                  value={formReceiverAddress}
                  onChange={(e) => setFormReceiverAddress(e.target.value)}
                  placeholder="Enter receiver address"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
                  Status *
                </label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v || 'process')}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditItem(null)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] bg-primary hover:bg-primary/90 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Redeem Record</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem && (
                <>Are you sure you want to delete this redeem record for <span className="font-bold text-gray-900">"{deleteItem.receiver_name}"</span>? This action cannot be undone.</>
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
