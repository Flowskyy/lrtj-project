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
import ModuleToolbar from "@/components/ModuleToolbar";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import Pagination from "@/components/Pagination";
import { useExportJob } from "@/hooks/use-export-job";
import ExportProgressDialog from "@/components/ExportProgressDialog";
import { formatWIBDate, formatDisplayDate } from "@/lib/formatWIBDate";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import { MoreVertical, Eye, Trash2, Search, Columns, Check, X, Users, Filter, Download } from "lucide-react";
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
  // No props needed anymore
}

export default function UsersContent({ }: UsersContentProps) {
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
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<string>("");
  const [showScopeSuggestions, setShowScopeSuggestions] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Modal and CRUD states
  const [deleteItem, setDeleteItem] = useState<MemberItem | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    nama: true,
    email: true,
    activation_slc: true,
    tier: true,
    created_at: true,
    actions: true,
  });

  // Export job hook
  const exportParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (activationSlcFilter !== "all") params.activation_slc = activationSlcFilter;
    if (tierFilter !== "all") params.tier = tierFilter;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.order = sortOrder;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [activationSlcFilter, tierFilter, sortBy, sortOrder, searchQuery, dateFrom, dateTo]);

  const { isExporting, isCancelling, processed, total, percentage, status, startExport, cancelExport } = useExportJob({
    moduleEndpoint: '/api/users',
    params: exportParams,
    onError: (msg) => toast.error(msg),
  });

  // Membership options for tier filter
  const [membershipOptions, setMembershipOptions] = useState<{ value: string; label: string }[]>([
    { value: "all", label: "All" },
  ]);

  // Search scopes for Users
  const userSearchScopes: SearchScope[] = [
    { field: "name", label: "Name" },
    { field: "email", label: "Email" },
  ];

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activationSlcFilter !== "all") params.set("activation_slc", activationSlcFilter);
      if (tierFilter !== "all") params.set("tier", tierFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
        if (searchScope) params.set("searchScope", searchScope);
      }
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
  }, [activationSlcFilter, tierFilter, sortBy, sortOrder, currentPage, searchQuery, searchScope, dateFrom, dateTo]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowScopeSuggestions(value.length >= 2);
    if (!value.trim()) {
      setSearchScope("");
    }
    setCurrentPage(1); // Reset to page 1 when search changes
  }, []);

  // Handle scope selection
  const handleScopeSelect = (scope: SearchScope) => {
    setSearchScope(scope.field);
    setCurrentPage(1);
  };

  // Handle search focus
  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowScopeSuggestions(true);
    }
  }, [searchQuery]);

  const activeFilterCount = (activationSlcFilter !== "all" ? 1 : 0) + (tierFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleResetFilters = () => {
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

  // Helper function to get activation SLC badge
  const getActivationSlcBadge = (activationSlc: number) => {
    if (activationSlc === 1) {
      return (
        <Badge className="bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 text-[10px] px-1.5 py-0.5">
          Activated
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 text-[10px] px-1.5 py-0.5">
        Not Activated
      </Badge>
    );
  };

  const getTierDisplay = (membershipName: string | null) => {
    if (!membershipName) return "-";
    return membershipName;
  };


  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : totalUsers}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Active SLC
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : activeSlc}
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
                  Inactive SLC
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : inactiveSlc}
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
            <CardTitle className="text-lg">User Management</CardTitle>
          </CardHeader>

          {/* Table Toolbar */}
          <ModuleToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name, email, or phone..."
            searchScopes={userSearchScopes}
            searchScope={searchScope}
            onScopeSelect={handleScopeSelect}
            showScopeSuggestions={showScopeSuggestions}
            onScopeSuggestionsClose={() => setShowScopeSuggestions(false)}
            onSearchFocus={() => {
              if (searchQuery.length >= 2) {
                setShowScopeSuggestions(true);
              }
            }}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortByOptions={[
              { value: "name", label: "Name" },
              { value: "created_at", label: "Created At" },
            ]}
            activationSlcFilter={activationSlcFilter}
            onActivationSlcFilterChange={setActivationSlcFilter}
            activationSlcOptions={[
              { value: "all", label: "All" },
              { value: "1", label: "Active SLC" },
              { value: "0", label: "Inactive SLC" },
            ]}
            showActivationSlcFilter={true}
            tierFilter={tierFilter}
            onTierFilterChange={setTierFilter}
            tierOptions={membershipOptions}
            showTierFilter={true}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            showDateRange={true}
            onResetFilters={handleResetFilters}
            activeFilterCount={activeFilterCount}
            visibleColumns={visibleColumns}
            onColumnVisibilityToggle={(key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            columnConfigs={[
              { key: "nama", label: "Name" },
              { key: "email", label: "Email" },
              { key: "activation_slc", label: "Activation SLC" },
              { key: "tier", label: "Tier" },
              { key: "created_at", label: "Created At" },
              { key: "actions", label: "Actions" },
            ]}
            primaryAction={{
              label: 'Export',
              onClick: () => {
                setShowExportDialog(true);
                startExport();
              },
              disabled: isExporting,
              loading: isExporting,
              loadingLabel: 'Exporting...',
            }}
          />

          {/* Table - Desktop */}
          <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <TableRow>
                  {visibleColumns.nama && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                      Name
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider min-w-[160px]">
                      Email
                    </TableHead>
                  )}
                  {visibleColumns.activation_slc && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-28">
                      Activation SLC
                    </TableHead>
                  )}
                  {visibleColumns.tier && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Tier
                    </TableHead>
                  )}
                  {visibleColumns.created_at && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Created
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="px-2 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider text-center w-24">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {loading ? (
                  <>
                    <TableRow>
                      {visibleColumns.nama && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.email && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.activation_slc && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.tier && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.nama && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.email && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.activation_slc && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.tier && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                    <TableRow>
                      {visibleColumns.nama && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.email && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-40" /></TableCell>}
                      {visibleColumns.activation_slc && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.tier && <TableCell className="px-2 py-1.5"><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.created_at && <TableCell className="px-2 py-1.5"><Skeleton className="h-3 w-24" /></TableCell>}
                      {visibleColumns.actions && <TableCell className="px-2 py-1.5"><Skeleton className="h-5 w-20" /></TableCell>}
                    </TableRow>
                  </>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.nama && (
                        <TableCell className="px-2 py-1.5 text-[11px] font-medium text-gray-900 max-w-[140px]">
                          <span className="block truncate" title={item.name || ""}>
                            {item.name || "-"}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.email && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600 truncate max-w-[160px]" title={item.email || ""}>
                          {item.email}
                        </TableCell>
                      )}
                      {visibleColumns.activation_slc && (
                        <TableCell className="px-2 py-1.5">
                          {getActivationSlcBadge(item.activation_slc)}
                        </TableCell>
                      )}
                      {visibleColumns.tier && (
                        <TableCell className="px-2 py-1.5">
                          <Badge className={`text-[10px] px-2 py-1 rounded-full font-medium ${getTierBadgeColor(item.membership_name)}`}>
                            {getTierDisplay(item.membership_name)}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.created_at && (
                        <TableCell className="px-2 py-1.5 text-[11px] text-gray-600">
                          {formatWIBDate(item.created_at)}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="px-2 py-1.5 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100 p-0 transition-colors">
                              <MoreVertical className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/users/${item.id}`)} className="text-[10px] h-6">
                                <Eye className="h-3 w-3 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => confirmDelete(item)} variant="destructive" className="text-[10px] h-6">
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
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-2 py-6 text-center text-[11px] text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Card List - Mobile */}
          <div className="md:hidden space-y-2">
            {loading ? (
              <>
                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </>
            ) : items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-semibold text-gray-900 truncate">{item.name || "-"}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.email}</p>
                        <div className="flex gap-1.5 mt-1">
                          {visibleColumns.activation_slc && (
                            <div>
                              {getActivationSlcBadge(item.activation_slc)}
                            </div>
                          )}
                          {visibleColumns.tier && (
                            <div>
                              <Badge className={`text-[10px] px-2 py-1 rounded-full font-medium ${getTierBadgeColor(item.membership_name)}`}>
                                {getTierDisplay(item.membership_name)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/users/${item.id}`)}
                        className="flex-1 min-h-[28px] text-[10px]"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(item)}
                        className="flex-1 min-h-[28px] text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
                <p className="text-[11px] text-gray-500">No users found.</p>
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
        description={`Are you sure you want to permanently delete "${deleteItem?.name}"? This action cannot be undone and the user will be completely removed from the database. Warning: This is a permanent hard delete. The user account and all associated data will be irretrievably lost.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Export Progress Dialog */}
      <ExportProgressDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        status={status === 'idle' ? null : { status, processed, total, percentage }}
        onCancel={cancelExport}
        isCancelling={isCancelling}
      />
    </div>
  );
}
