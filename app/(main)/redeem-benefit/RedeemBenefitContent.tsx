"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Filter, MoreVertical, Eye, Trash2, Search, Columns, ChevronDown, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RedeemBenefitItem {
  id: number;
  user_id: number;
  merchant_id: number;
  name: string;
  email: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface RedeemBenefitContentProps {
  username: string;
}

export default function RedeemBenefitContent({ username }: RedeemBenefitContentProps) {
  const [items, setItems] = useState<RedeemBenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<RedeemBenefitItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RedeemBenefitItem | null>(null);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    user_id: true,
    merchant_id: true,
    name: true,
    email: true,
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

      const res = await fetch(`/api/redeem-benefit?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setStatusCounts(response.meta?.statusCounts || {});
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, sortBy, sortOrder, currentPage, searchQuery]);

  // Count active filters
  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/redeem-benefit/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
        toast.success("Redeem benefit record deleted successfully");
      } else {
        toast.error("Failed to delete redeem benefit record");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete redeem benefit record");
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed" || statusLower === "approved") {
      return <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px]">{status}</Badge>;
    } else if (statusLower === "process" || statusLower === "pending") {
      return <Badge variant="default" className="bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 text-[10px]">{status}</Badge>;
    } else if (statusLower === "rejected" || statusLower === "cancelled") {
      return <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 text-[10px]">{status}</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px]">{status}</Badge>;
  };

  // Get status badge color for stat cards
  const getStatusCardColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed" || statusLower === "approved") {
      return { bg: "bg-green-100", text: "text-green-700", svgColor: "text-green-700" };
    } else if (statusLower === "process" || statusLower === "pending") {
      return { bg: "bg-yellow-100", text: "text-yellow-700", svgColor: "text-yellow-700" };
    } else if (statusLower === "rejected" || statusLower === "cancelled") {
      return { bg: "bg-red-100", text: "text-red-700", svgColor: "text-red-700" };
    }
    return { bg: "bg-gray-100", text: "text-gray-500", svgColor: "text-gray-500" };
  };

  // Get unique status keys for stat cards
  const statusKeys = Object.keys(statusCounts);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalCount}
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
        {statusKeys.slice(0, 2).map((status) => {
          const colors = getStatusCardColor(status);
          return (
            <Card key={status} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {status}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${colors.text}`}>
                      {loading ? "..." : statusCounts[status]}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <svg className={`h-5 w-5 ${colors.svgColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-4">
          <CardHeader className="p-3">
            <CardTitle className="text-lg">Redeem Benefit</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  <Input
                    type="text"
                    placeholder="Search by name, email..."
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, merchant_id: !prev.merchant_id }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.merchant_id && <Check className="h-4 w-4" />}
                      <span>Merchant ID</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, name: !prev.name }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.name && <Check className="h-4 w-4" />}
                      <span>Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, email: !prev.email }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.email && <Check className="h-4 w-4" />}
                      <span>Email</span>
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
                        {statusKeys.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
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
                  {visibleColumns.merchant_id && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Merchant ID
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Email
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
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.updated_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.user_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.merchant_id && <TableCell><Skeleton className="h-5 w-12" /></TableCell>}
                      {visibleColumns.name && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
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
                      {visibleColumns.merchant_id && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 font-medium">
                          {item.merchant_id}
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="px-3 py-1.5 text-xs font-medium text-gray-900">
                          {item.name}
                        </TableCell>
                      )}
                      {visibleColumns.email && (
                        <TableCell className="px-3 py-1.5 text-xs text-gray-500 max-w-[200px]">
                          <span className="block truncate" title={item.email}>
                            {item.email}
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
                              <DropdownMenuItem onClick={() => setViewItem(item)} className="text-xs h-8">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View
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
                      No redeem benefit records found.
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
                        <h3 className="text-sm font-bold text-gray-900 truncate">#{item.id} – {item.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">User ID: {item.user_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Merchant ID: {item.merchant_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Email: {item.email}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-gray-400">
                No redeem benefit records found.
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

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col w-[calc(100%-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>View Redeem Benefit</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ID</label>
                <div className="text-sm text-gray-900">#{viewItem?.id}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">User ID</label>
                <div className="text-sm text-gray-900">{viewItem?.user_id}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Merchant ID</label>
                <div className="text-sm text-gray-900">{viewItem?.merchant_id}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <div>{getStatusBadge(viewItem?.status || '')}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <div className="text-sm text-gray-900">{viewItem?.name}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <div className="text-sm text-gray-900">{viewItem?.email}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created</label>
                <div className="text-sm text-gray-900">{viewItem?.created_at ? new Date(viewItem.created_at).toLocaleString() : '-'}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Updated</label>
                <div className="text-sm text-gray-900">{viewItem?.updated_at ? new Date(viewItem.updated_at).toLocaleString() : '-'}</div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
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
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Redeem Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem && (
                <>Are you sure you want to delete this redeem benefit record for <span className="font-bold text-gray-900">"{deleteItem.name}"</span>? This action cannot be undone.</>
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
