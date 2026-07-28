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
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import ExportDialog from "@/components/ExportDialog";
import { exportToExcel, ExportColumn } from "@/lib/exportToExcel";
import { MoreVertical, Eye, Trash2, Search, Columns, Check, X, Users, Filter, Download, CheckSquare, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberItem {
  id: number;
  name: string | null;
  email: string;
  no_telepon: string | null;
  alamat: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  slc_point: number;
  trip_count: number;
  jenis_kelamin: string | null;
  lrtj_saldo: string | null;
  verified_at: string | null;
  nik: string | null;
  tempat_lahir: string | null;
  birthday: string | null;
  province_id: number | null;
  regency_id: number | null;
  activation_slc: number;
  activation_slc_at: string | null;
  activation_lrtjpay: number | null;
  activation_lrtjpay_at: string | null;
  member_level_id: number | null;
  push_notification: number;
  email_notification: number;
  new_content_notification: number;
  image: string | null;
  ecard: string | null;
  ecard2: string | null;
}

interface UsersContentProps {
  username: string;
}

export default function UsersContent({ username }: UsersContentProps) {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeSlcCount, setActiveSlcCount] = useState(0);
  const [inactiveSlcCount, setInactiveSlcCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [activationSlcFilter, setActivationSlcFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<MemberItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MemberItem | null>(null);
  const [redeemCount, setRedeemCount] = useState(0);


  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    nama: true,
    email: true,
    created_at: true,
    actions: true,
  });

  // Row selection states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activationSlcFilter !== "all") params.set("activation_slc", activationSlcFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", currentPage.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
        setActiveSlcCount(response.meta?.activeSlc || 0);
        setInactiveSlcCount(response.meta?.inactiveSlc || 0);
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
  }, [activationSlcFilter, sortBy, sortOrder, currentPage, searchQuery, dateFrom, dateTo]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, []);

  const activeFilterCount = (activationSlcFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleResetFilters = () => {
    setActivationSlcFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/users/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const result = await res.json();
        await fetchItems();
        setDeleteItem(null);
        toast.success(result.message || "User deleted successfully");
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete user");
    }
  };

  // Check redeem count before delete
  const checkRedeemCount = async (item: MemberItem) => {
    try {
      const res = await fetch(`/api/users/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setRedeemCount(data.redeemCount || 0);
      }
    } catch (err) {
      console.error("Failed to check redeem count", err);
    }
    setDeleteItem(item);
  };

  // Computed values
  const total = totalCount;
  const activeSlc = activeSlcCount;
  const inactiveSlc = inactiveSlcCount;

  // Handle row selection
  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(items.map(item => item.id)));
    }
  };

  // Export handlers
  const handleExport = async (scope: "full" | "preview") => {
    setExporting(true);
    try {
      let dataToExport: MemberItem[];
      
      if (selectedRows.size > 0) {
        // Export only checked rows
        dataToExport = items.filter(item => selectedRows.has(item.id));
      } else {
        // Fetch all filtered data
        const params = new URLSearchParams();
        if (activationSlcFilter !== "all") params.set("activation_slc", activationSlcFilter);
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("order", sortOrder);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("export", "true");

        const res = await fetch(`/api/users?${params}`);
        if (res.ok) {
          const response = await res.json();
          dataToExport = response.data || [];
        } else {
          dataToExport = [];
        }
      }

      let columns: ExportColumn[];
      if (scope === "full") {
        columns = [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "no_telepon", label: "Phone" },
          { key: "alamat", label: "Address" },
          { key: "status", label: "Status" },
          { key: "jenis_kelamin", label: "Gender" },
          { key: "nik", label: "NIK" },
          { key: "tempat_lahir", label: "Birthplace" },
          { key: "birthday", label: "Birthday" },
          { key: "slc_point", label: "SLC Point" },
          { key: "trip_count", label: "Trip Count" },
          { key: "lrtj_saldo", label: "LRTJ Saldo" },
          { key: "verified_at", label: "Verified At" },
          { key: "created_at", label: "Created At" },
          { key: "updated_at", label: "Updated At" },
        ];
      } else {
        // Dynamic columns based on visibleColumns
        columns = [];
        if (visibleColumns.nama) columns.push({ key: "name", label: "Name" });
        if (visibleColumns.email) columns.push({ key: "email", label: "Email" });
        if (visibleColumns.created_at) columns.push({ key: "created_at", label: "Created At" });
      }

      exportToExcel(dataToExport, columns, "users-export");
      setExportDialogOpen(false);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  // Get field lists for export dialog
  const fullDataFields = ["ID", "Name", "Email", "Phone", "Address", "Status", "Gender", "NIK", "Birthplace", "Birthday", "SLC Point", "Trip Count", "LRTJ Saldo", "Verified At", "Created At", "Updated At"];
  const getPreviewFields = () => {
    const fields: string[] = [];
    if (visibleColumns.nama) fields.push("Name");
    if (visibleColumns.email) fields.push("Email");
    if (visibleColumns.created_at) fields.push("Created At");
    return fields;
  };


  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : total}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Active SLC Users
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {loading ? "..." : activeSlc}
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
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Inactive SLC Users
                </p>
                <p className="text-2xl font-bold text-gray-500 mt-1">
                  {loading ? "..." : inactiveSlc}
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
            <CardTitle className="text-lg">User Management</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setExportDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white min-h-[44px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-8 min-h-[44px] w-full sm:w-64"
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
              <TableFilterSortMenu
                statusFilter="all"
                onStatusFilterChange={() => {}}
                activationSlcFilter={activationSlcFilter}
                onActivationSlcFilterChange={setActivationSlcFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                showStatusFilter={false}
                showActivationSlcFilter={true}
                sortByOptions={[
                  { value: "name", label: "Name" },
                  { value: "created_at", label: "Created At" },
                ]}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                showDateRange={true}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px]">
                  <Columns className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, nama: !prev.nama }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.nama && <Check className="h-4 w-4" />}
                      <span>Name</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, email: !prev.email }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.email && <Check className="h-4 w-4" />}
                      <span>Email</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, created_at: !prev.created_at }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.created_at && <Check className="h-4 w-4" />}
                      <span>Created At</span>
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
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.select && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center"
                      >
                        {selectedRows.size === items.length && items.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.nama && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[140px] max-w-[180px]">
                      Name
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[160px] max-w-[220px]">
                      Email
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Created At
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-32">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.nama && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.nama && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.nama && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.select && (
                        <TableCell className="px-2 py-1">
                          <button
                            onClick={() => handleSelectRow(item.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedRows.has(item.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.nama && (
                        <TableCell className="px-2 py-1 text-xs font-medium text-gray-900 max-w-[140px]">
                          <span className="block truncate" title={item.name || ""}>
                            {item.name || "-"}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.email && (
                        <TableCell className="px-2 py-1 text-xs text-gray-600 truncate max-w-[160px]" title={item.email || ""}>
                          {item.email}
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-2 py-1 text-xs text-gray-600">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1 text-center">
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => checkRedeemCount(item)} variant="destructive" className="text-xs h-8">
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
                      No users found.
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
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </div>
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name || "-"}</h3>
                      <p className="text-xs text-gray-600 truncate">{item.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewItem(item)}
                      className="flex-1 min-h-[36px] text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkRedeemCount(item)}
                      className="flex-1 min-h-[36px] text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
                <p className="text-xs text-gray-400">No users found.</p>
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
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="sm:max-w-[600px] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="overflow-y-auto space-y-4 rounded-b-xl">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID</label>
                    <p className="text-sm text-gray-900">{viewItem.id}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{viewItem.status === 1 ? "True" : "False"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{viewItem.name || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email</label>
                    <p className="text-sm text-gray-900 break-all">{viewItem.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{viewItem.no_telepon || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Gender</label>
                    <p className="text-sm text-gray-900">
                      {viewItem.jenis_kelamin === "L" ? "Laki-laki" : viewItem.jenis_kelamin === "P" ? "Perempuan" : viewItem.jenis_kelamin || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Address</label>
                  <p className="text-sm text-gray-900 break-all">{viewItem.alamat || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">NIK</label>
                    <p className="text-sm text-gray-900 break-all">{viewItem.nik || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Birthplace</label>
                    <p className="text-sm text-gray-900">{viewItem.tempat_lahir || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Birthday</label>
                    <p className="text-sm text-gray-900">{viewItem.birthday ? new Date(viewItem.birthday).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Image</label>
                    <p className="text-sm text-gray-900 break-all">{viewItem.image || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">ECard</label>
                    <p className="text-sm text-gray-900 break-all">{viewItem.ecard || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">ECard 2</label>
                    <p className="text-sm text-gray-900 break-all">{viewItem.ecard2 || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Province ID</label>
                    <p className="text-sm text-gray-900">{viewItem.province_id || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Regency ID</label>
                    <p className="text-sm text-gray-900">{viewItem.regency_id || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Member Level ID</label>
                    <p className="text-sm text-gray-900">{viewItem.member_level_id || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Created At</label>
                    <p className="text-sm text-gray-900">{viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Updated At</label>
                    <p className="text-sm text-gray-900">{viewItem.updated_at ? new Date(viewItem.updated_at).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Verified</label>
                    {viewItem.verified_at ? (
                      <Badge variant="default" className="bg-green-50 text-green-700 border border-green-100 text-[10px]">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px]">
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Financial Data */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3">Financial Data</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">LRTJ Saldo</label>
                      <p className="text-sm text-gray-900">
                        {viewItem.lrtj_saldo ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(viewItem.lrtj_saldo)) : "Rp 0"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">SLC Point</label>
                      <p className="text-sm text-gray-900">{viewItem.slc_point.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Trip Count</label>
                      <p className="text-sm text-gray-900">{viewItem.trip_count.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Activation Status */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3">Activation Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">SLC Activation</label>
                      <p className="text-sm text-gray-900">{viewItem.activation_slc === 1 ? "True" : "False"}</p>
                      {viewItem.activation_slc_at && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(viewItem.activation_slc_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">LRTJPay Activation</label>
                      <p className="text-sm text-gray-900">{viewItem.activation_lrtjpay === 1 ? "True" : "False"}</p>
                      {viewItem.activation_lrtjpay_at && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(viewItem.activation_lrtjpay_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3">Notification Preferences</h3>
                  <div className="grid grid-cols-3 gap-4 pb-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Push Notification</label>
                      <p className="text-sm text-gray-900">{viewItem.push_notification === 1 ? "True" : "False"}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Notification</label>
                      <p className="text-sm text-gray-900">{viewItem.email_notification === 1 ? "True" : "False"}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">New Content Notification</label>
                      <p className="text-sm text-gray-900">{viewItem.new_content_notification === 1 ? "True" : "False"}</p>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
              {redeemCount > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: This user has {redeemCount} related redeem record(s) that will become orphaned.
                </span>
              )}
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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        loading={exporting}
        fullDataFields={fullDataFields}
        previewDataFields={getPreviewFields()}
        selectedCount={selectedRows.size}
        totalFilteredCount={totalCount}
      />
    </div>
  );
}
