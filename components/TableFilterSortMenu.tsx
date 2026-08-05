"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableFilterSortMenuProps {
  // Filter props
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
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
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  genderOptions?: { value: string; label: string }[];
  verifiedOptions?: { value: string; label: string }[];
  activationSlcOptions?: { value: string; label: string }[];
  tierOptions?: { value: string; label: string }[];
  typeOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
  showTypeFilter?: boolean;
  showGenderFilter?: boolean;
  showVerifiedFilter?: boolean;
  showActivationSlcFilter?: boolean;
  showTierFilter?: boolean;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  
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
  statusFilter = "all",
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
  categoryFilter = "all",
  onCategoryFilterChange,
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
  ],
  typeOptions = [
    { value: "all", label: "All" },
    { value: "news", label: "News" },
    { value: "pers", label: "Press Release" },
  ],
  categoryOptions = [
    { value: "all", label: "All" },
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
  showStatusFilter = false,
  showCategoryFilter = false,
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
        <DropdownMenuTrigger className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[44px] relative shadow-sm">
          <Filter className="h-4 w-4 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 h-5 w-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" collisionAvoidance={{ side: 'shift' }} className="w-80 rounded-xl shadow-lg border-gray-200 bg-white p-2">
          {showStatusFilter && onStatusFilterChange && (
            <div className="space-y-2">
              <div className="px-3 py-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
              </div>
              <div className="px-3 pb-2">
                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v || 'all')}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                    <SelectValue placeholder="Select status">
                      {statusOptions.find(opt => opt.value === statusFilter)?.label || "Select status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {showGenderFilter && onGenderFilterChange && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Gender</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={genderFilter} onValueChange={(v) => onGenderFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select gender">
                        {genderOptions.find(opt => opt.value === genderFilter)?.label || "Select gender"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          {showVerifiedFilter && onVerifiedFilterChange && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Verified</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={verifiedFilter} onValueChange={(v) => onVerifiedFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select verification">
                        {verifiedOptions.find(opt => opt.value === verifiedFilter)?.label || "Select verification"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {verifiedOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {showActivationSlcFilter && onActivationSlcFilterChange && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Activation SLC</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={activationSlcFilter} onValueChange={(v) => onActivationSlcFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select activation">
                        {activationSlcOptions.find(opt => opt.value === activationSlcFilter)?.label || "Select activation"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {activationSlcOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {showTierFilter && onTierFilterChange && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tier</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={tierFilter} onValueChange={(v) => onTierFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select tier">
                        {tierOptions.find(opt => opt.value === tierFilter)?.label || "Select tier"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {tierOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {showTypeFilter && onTypeFilterChange && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select type">
                        {typeOptions.find(opt => opt.value === typeFilter)?.label || "Select type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {showCategoryFilter && onCategoryFilterChange && (
            <>
              {(showStatusFilter || showGenderFilter || showVerifiedFilter || showActivationSlcFilter || showTierFilter || showTypeFilter) && <DropdownMenuSeparator className="my-2" />}
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Category</label>
                </div>
                <div className="px-3 pb-2">
                  <Select value={categoryFilter} onValueChange={(v) => onCategoryFilterChange(v || 'all')}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Select category">
                        {categoryOptions.find(opt => opt.value === categoryFilter)?.label || "Select category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          {showDateRange && onDateFromChange && onDateToChange && (
            <>
              {(showStatusFilter || showGenderFilter || showVerifiedFilter || showActivationSlcFilter || showTierFilter || showTypeFilter || showCategoryFilter) && <DropdownMenuSeparator className="my-2" />}
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">From Date</label>
                </div>
                <div className="px-3 pb-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    className="h-10 rounded-lg border-gray-200 bg-white"
                  />
                </div>
                <div className="px-3 py-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">To Date</label>
                </div>
                <div className="px-3 pb-2">
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    className="h-10 rounded-lg border-gray-200 bg-white"
                  />
                </div>
              </div>
            </>
          )}
          
          {onResetFilters && activeFilterCount > 0 && (
            <>
              {(showStatusFilter || showGenderFilter || showVerifiedFilter || showActivationSlcFilter || showTierFilter || showTypeFilter || showCategoryFilter || showDateRange) && <DropdownMenuSeparator className="my-2" />}
              <div className="px-3 pb-2">
                <button
                  onClick={onResetFilters}
                  className="w-full h-10 px-4 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[44px] shadow-sm">
          <ArrowUpDown className="h-4 w-4 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Sort</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" collisionAvoidance={{ side: 'shift' }} className="w-80 rounded-xl shadow-lg border-gray-200 bg-white p-2">
          <div className="space-y-2">
            <div className="px-3 py-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sort By</label>
            </div>
            <div className="px-3 pb-2">
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v || 'id')}>
                <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                  <SelectValue placeholder="Select sort field">
                    {sortByOptions.find(opt => opt.value === sortBy)?.label || "Select sort field"}
                  </SelectValue>
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
            <DropdownMenuSeparator className="my-2" />
            <div className="px-3 py-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Order</label>
            </div>
            <div className="px-3 pb-2">
              <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v || 'asc')}>
                <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white">
                  <SelectValue placeholder="Select order">
                    {sortOrder === 'asc' ? 'Ascending' : sortOrder === 'desc' ? 'Descending' : 'Select order'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
