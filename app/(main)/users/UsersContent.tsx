"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Pagination from "@/components/Pagination";
import { useExportJob } from "@/hooks/use-export-job";
import ExportProgressDialog from "@/components/ExportProgressDialog";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { MoreVertical, Eye, Trash2, Search, Columns, Check, X, Users, Filter, Download, CheckSquare, Square } from "lucide-react";
import { useRouter } from "next/navigation";
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
  membership_name: string | null;
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
  const router = useRouter();
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeSlcCount, setActiveSlcCount] = useState(0);
  const [inactiveSlcCount, setInactiveSlcCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and Sort states
  const [activationSlcFilter, setActivationSlcFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Modal and CRUD states
  const [deleteItem, setDeleteItem] = useState<MemberItem | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    nama: true,
    email: true,
    tier: true,
    created_at: true,
    actions: true,
  });

  // Row selection states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Export job hook
  const exportParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (activationSlcFilter !== "all") params.activation_slc = activationSlcFilter;
    if (tierFilter !== "all") params.tier = tierFilter;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.order = sortOrder;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [statusFilter, activationSlcFilter, tierFilter, sortBy, sortOrder, searchQuery, dateFrom, dateTo]);

  const { isExporting, processed, total, percentage, status, startExport, cancelExport } = useExportJob({
    moduleEndpoint: '/api/users',
    params: exportParams,
    onError: (msg) => toast.error(msg),
  });
  
  // Membership options for tier filter
  const [membershipOptions, setMembershipOptions] = useState<{ value: string; label: string }[]>([
    { value: "all", label: "All" },
  ]);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (activationSlcFilter !== "all") params.set("activation_slc", activationSlcFilter);
      if (tierFilter !== "all") params.set("tier", tierFilter);
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

  // Fetch membership options for tier filter
  useEffect(() => {
    const fetchMembershipOptions = async () => {
      try {
        const res = await fetch('/api/membership');
        if (res.ok) {
          const memberships = await res.json();
          const options = [
            { value: "all", label: "All" },
            ...memberships.map((m: any) => ({
              value: m.id.toString(),
              label: m.name,
            })),
          ];
          setMembershipOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch membership options", err);
      }
    };
    fetchMembershipOptions();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, activationSlcFilter, tierFilter, sortBy, sortOrder, currentPage, searchQuery, dateFrom, dateTo]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, []);

  const activeFilterCount = (statusFilter !== "active" ? 1 : 0) + (activationSlcFilter !== "all" ? 1 : 0) + (tierFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleResetFilters = () => {
    setStatusFilter("active");
    setActivationSlcFilter("all");
    setTierFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  // Delete Item
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const result = await res.json();
        await fetchItems();
        setDeleteItem(null);
        toast.success(result.message || "User permanently deleted successfully");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Set delete item for confirmation dialog
  const confirmDelete = (item: MemberItem) => {
    setDeleteItem(item);
  };

  // Computed values
  const totalUsers = totalCount;
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



  // Helper function to get badge color based on membership name
  const getTierBadgeColor = (membershipName: string | null) => {
    if (!membershipName) {
      return "bg-gray-100 text-gray-600";
    }
    const nameLower = membershipName.toLowerCase();
    if (nameLower.includes("silver")) {
      return "bg-gray-100 text-gray-700 border border-gray-300";
    } else if (nameLower.includes("gold")) {
      return "bg-amber-50 text-amber-700 border border-amber-300";
    } else if (nameLower.includes("platinum")) {
      return "bg-slate-100 text-slate-700 border border-slate-300";
    }
    return "bg-gray-100 text-gray-600";
  };

  const getTierDisplay = (membershipName: string | null) => {
    if (!membershipName) return "-";
    return membershipName;
  };


  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : totalUsers}
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
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
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
              <TableFilterSortMenu
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                activationSlcFilter={activationSlcFilter}
                onActivationSlcFilterChange={setActivationSlcFilter}
                tierFilter={tierFilter}
                onTierFilterChange={setTierFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                showStatusFilter={true}
                showActivationSlcFilter={true}
                showTierFilter={true}
                tierOptions={membershipOptions}
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
                  <DropdownMenuItem onClick={() => setVisibleColumns(prev => ({ ...prev, tier: !prev.tier }))}>
                    <div className="flex items-center gap-2">
                      {visibleColumns.tier && <Check className="h-4 w-4" />}
                      <span>Tier</span>
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
            <Button
              onClick={() => {
                setShowExportDialog(true);
                startExport();
              }}
              disabled={isExporting}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
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
                  {visibleColumns.tier && (
                    <TableHead className="px-2 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Tier
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
                      {visibleColumns.tier && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.nama && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.tier && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell><Skeleton className="h-6 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.select && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
                      {visibleColumns.nama && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      {visibleColumns.email && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.tier && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
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
                      {visibleColumns.tier && (
                        <TableCell className="px-2 py-1">
                          <Badge className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTierBadgeColor(item.membership_name)}`}>
                            {getTierDisplay(item.membership_name)}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-2 py-1 text-xs text-gray-600">
                          {formatWIBDate(item.created_at)}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/users/${item.id}`)} className="text-xs h-8">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => confirmDelete(item)} variant="destructive" className="text-xs h-8">
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
                      {visibleColumns.tier && (
                        <div className="mt-2">
                          <Badge className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTierBadgeColor(item.membership_name)}`}>
                            {getTierDisplay(item.membership_name)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/users/${item.id}`)}
                      className="flex-1 min-h-[36px] text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDelete(item)}
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={totalCount}
            pageSize={50}
          />
        </CardContent>
      </Card>


      {/* Delete Alert Dialog */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Permanently Delete User"
        description={
          <>
            Are you sure you want to permanently delete "{deleteItem?.name}"? This action cannot be undone and the user will be completely removed from the database.
            <span className="block mt-2 text-red-600 font-medium">
              Warning: This is a permanent hard delete. The user account and all associated data will be irretrievably lost.
            </span>
          </>
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Export Progress Dialog */}
      <ExportProgressDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        status={status === 'idle' ? null : { status, processed, total, percentage }}
        onCancel={cancelExport}
      />
    </div>
  );
}
