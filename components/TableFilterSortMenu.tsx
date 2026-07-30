"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableFilterSortMenuProps {
  // Filter props
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  genderFilter?: string;
  onGenderFilterChange?: (value: string) => void;
  verifiedFilter?: string;
  onVerifiedFilterChange?: (value: string) => void;
  activationSlcFilter?: string;
  onActivationSlcFilterChange?: (value: string) => void;
  tierFilter?: string;
  onTierFilterChange?: (value: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  genderOptions?: { value: string; label: string }[];
  verifiedOptions?: { value: string; label: string }[];
  activationSlcOptions?: { value: string; label: string }[];
  tierOptions?: { value: string; label: string }[];
  typeOptions?: { value: string; label: string }[];
  showTypeFilter?: boolean;
  showGenderFilter?: boolean;
  showVerifiedFilter?: boolean;
  showActivationSlcFilter?: boolean;
  showTierFilter?: boolean;
  showStatusFilter?: boolean;
  
  // Sort props
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  sortByOptions?: { value: string; label: string }[];
  
  // Date range props
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
  showDateRange?: boolean;
  
  // Reset
  onResetFilters?: () => void;
  activeFilterCount?: number;
}

export default function TableFilterSortMenu({
  statusFilter,
  onStatusFilterChange,
  genderFilter = "all",
  onGenderFilterChange,
  verifiedFilter = "all",
  onVerifiedFilterChange,
  activationSlcFilter = "all",
  onActivationSlcFilterChange,
  tierFilter = "all",
  onTierFilterChange,
  typeFilter = "all",
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  genderOptions = [
    { value: "all", label: "All" },
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ],
  verifiedOptions = [
    { value: "all", label: "All" },
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ],
  activationSlcOptions = [
    { value: "all", label: "All" },
    { value: "1", label: "Active SLC" },
    { value: "0", label: "Inactive SLC" },
  ],
  tierOptions = [
    { value: "all", label: "All" },
    { value: "1", label: "Silver" },
    { value: "2", label: "Gold" },
    { value: "3", label: "Platinum" },
  ],
  typeOptions = [
    { value: "all", label: "All" },
    { value: "news", label: "News" },
    { value: "pers", label: "Press Release" },
  ],
  sortByOptions = [
    { value: "id", label: "ID" },
    { value: "createdAt", label: "Created Date" },
    { value: "editedBy", label: "Edited By" },
  ],
  showTypeFilter = false,
  showGenderFilter = false,
  showVerifiedFilter = false,
  showActivationSlcFilter = false,
  showTierFilter = false,
  showStatusFilter = true,
  dateFrom = "",
  onDateFromChange,
  dateTo = "",
  onDateToChange,
  showDateRange = false,
  onResetFilters,
  activeFilterCount = 0,
}: TableFilterSortMenuProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px] relative">
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-2 h-5 w-5 flex items-center justify-center bg-primary text-white text-[10px] rounded-full">
              {activeFilterCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 rounded-xl shadow-lg border-gray-200">
          {showStatusFilter && (
            <>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {showGenderFilter && onGenderFilterChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gender</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={genderFilter} onValueChange={(v) => onGenderFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {showVerifiedFilter && onVerifiedFilterChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Verified</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={verifiedFilter} onValueChange={(v) => onVerifiedFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiedOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showActivationSlcFilter && onActivationSlcFilterChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Activation SLC</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={activationSlcFilter} onValueChange={(v) => onActivationSlcFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activationSlcOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showTierFilter && onTierFilterChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tier</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={tierFilter} onValueChange={(v) => onTierFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showTypeFilter && onTypeFilterChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Type</label>
              </div>
              <div className="px-3 pb-3">
                <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v || 'all')}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {showDateRange && onDateFromChange && onDateToChange && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">From Date</label>
              </div>
              <div className="px-3 pb-3">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">To Date</label>
              </div>
              <div className="px-3 pb-3">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>
            </>
          )}
          
          {onResetFilters && activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onResetFilters} className="text-red-600 font-medium">
                Reset Filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 rounded-xl shadow-lg border-gray-200">
          <div className="px-3 py-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sort By</label>
          </div>
          <div className="px-3 pb-3">
            <Select value={sortBy} onValueChange={(v) => onSortByChange(v || 'id')}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortByOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DropdownMenuSeparator />
          <div className="px-3 py-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Order</label>
          </div>
          <div className="px-3 pb-3">
            <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v || 'asc')}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
