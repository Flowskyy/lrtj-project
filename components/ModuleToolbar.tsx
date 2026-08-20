"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import SearchScopeSuggestions, { SearchScope } from "@/components/SearchScopeSuggestions";
import { Search, Columns, Check, Download, Plus } from "lucide-react";
import Link from "next/link";

export interface ColumnConfig {
  key: string;
  label: string;
}

export interface PrimaryActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

interface ModuleToolbarProps {
  // Search props
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchScopes: SearchScope[];
  searchScope: string;
  onScopeSelect: (scope: SearchScope) => void;
  showScopeSuggestions: boolean;
  onScopeSuggestionsClose: () => void;
  onSearchFocus?: () => void;
  
  // Filter/Sort props (passed to TableFilterSortMenu)
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  sortByOptions: Array<{ value: string; label: string }>;
  
  // Filter props (optional, depends on module)
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  categoryOptions?: Array<{ value: string; label: string }>;
  showCategoryFilter?: boolean;
  
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  showStatusFilter?: boolean;
  
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  typeOptions?: Array<{ value: string; label: string }>;
  showTypeFilter?: boolean;
  
  activationSlcFilter?: string;
  onActivationSlcFilterChange?: (value: string) => void;
  activationSlcOptions?: Array<{ value: string; label: string }>;
  showActivationSlcFilter?: boolean;
  
  tierFilter?: string;
  onTierFilterChange?: (value: string) => void;
  tierOptions?: Array<{ value: string; label: string }>;
  showTierFilter?: boolean;
  
  genderFilter?: string;
  onGenderFilterChange?: (value: string) => void;
  genderOptions?: Array<{ value: string; label: string }>;
  showGenderFilter?: boolean;
  
  verifiedFilter?: string;
  onVerifiedFilterChange?: (value: string) => void;
  verifiedOptions?: Array<{ value: string; label: string }>;
  showVerifiedFilter?: boolean;
  
  actorFilter?: string;
  onActorFilterChange?: (value: string) => void;
  actorOptions?: Array<{ value: string; label: string }>;
  showActorFilter?: boolean;
  
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
  showDateRange?: boolean;
  
  onResetFilters?: () => void;
  activeFilterCount?: number;
  onApplyFilters?: () => void;
  
  // Column visibility props
  visibleColumns: { [key: string]: boolean };
  onColumnVisibilityToggle: (key: string) => void;
  columnConfigs: ColumnConfig[];
  
  // Primary action button props
  primaryAction?: PrimaryActionButton;
}

export default function ModuleToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchScopes,
  searchScope,
  onScopeSelect,
  showScopeSuggestions,
  onScopeSuggestionsClose,
  onSearchFocus,
  
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  sortByOptions,
  
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  showCategoryFilter,
  
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  showStatusFilter,
  
  typeFilter,
  onTypeFilterChange,
  typeOptions,
  showTypeFilter,
  
  activationSlcFilter,
  onActivationSlcFilterChange,
  activationSlcOptions,
  showActivationSlcFilter,
  
  tierFilter,
  onTierFilterChange,
  tierOptions,
  showTierFilter,
  
  genderFilter,
  onGenderFilterChange,
  genderOptions,
  showGenderFilter,
  
  verifiedFilter,
  onVerifiedFilterChange,
  verifiedOptions,
  showVerifiedFilter,
  
  actorFilter,
  onActorFilterChange,
  actorOptions,
  showActorFilter,
  
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showDateRange,
  
  onResetFilters,
  activeFilterCount,
  onApplyFilters,
  
  visibleColumns,
  onColumnVisibilityToggle,
  columnConfigs,
  
  primaryAction,
}: ModuleToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search Input with Suggestions */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 h-9 border border-gray-200 shadow-sm rounded-lg focus:border-gray-300"
            onFocus={() => {
              if (searchQuery.length >= 2 && onSearchFocus) {
                onSearchFocus();
              }
            }}
          />
          <SearchScopeSuggestions
            searchQuery={searchQuery}
            scopes={searchScopes}
            onScopeSelect={onScopeSelect}
            isVisible={showScopeSuggestions}
            onClose={onScopeSuggestionsClose}
          />
        </div>

        {/* Filter/Sort Menu */}
        <TableFilterSortMenu
          sortBy={sortBy}
          onSortByChange={onSortByChange}
          sortOrder={sortOrder}
          onSortOrderChange={onSortOrderChange}
          sortByOptions={sortByOptions}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          categoryOptions={categoryOptions}
          showCategoryFilter={showCategoryFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          statusOptions={statusOptions}
          showStatusFilter={showStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
          typeOptions={typeOptions}
          showTypeFilter={showTypeFilter}
          activationSlcFilter={activationSlcFilter}
          onActivationSlcFilterChange={onActivationSlcFilterChange}
          activationSlcOptions={activationSlcOptions}
          showActivationSlcFilter={showActivationSlcFilter}
          tierFilter={tierFilter}
          onTierFilterChange={onTierFilterChange}
          tierOptions={tierOptions}
          showTierFilter={showTierFilter}
          genderFilter={genderFilter}
          onGenderFilterChange={onGenderFilterChange}
          genderOptions={genderOptions}
          showGenderFilter={showGenderFilter}
          verifiedFilter={verifiedFilter}
          onVerifiedFilterChange={onVerifiedFilterChange}
          verifiedOptions={verifiedOptions}
          showVerifiedFilter={showVerifiedFilter}
          actorFilter={actorFilter}
          onActorFilterChange={onActorFilterChange}
          actorOptions={actorOptions}
          showActorFilter={showActorFilter}
          dateFrom={dateFrom}
          onDateFromChange={onDateFromChange}
          dateTo={dateTo}
          onDateToChange={onDateToChange}
          showDateRange={showDateRange}
          onResetFilters={onResetFilters}
          onApplyFilters={onApplyFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Column Visibility Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[40px] shadow-sm">
            <Columns className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" side="bottom" collisionAvoidance={{ side: 'shift' }}>
            {columnConfigs.map((config) => (
              <DropdownMenuItem
                key={config.key}
                onClick={() => onColumnVisibilityToggle(config.key)}
              >
                <div className="flex items-center gap-2">
                  {visibleColumns[config.key] && <Check className="h-3 w-3" />}
                  <span>{config.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Primary Action Button */}
      {primaryAction && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {primaryAction.href ? (
            <Link href={primaryAction.href}>
              <Button
                disabled={primaryAction.disabled}
                className={`min-h-[40px] ${primaryAction.className || 'bg-[#E5262C] hover:bg-[#c91e24] text-white'}`}
                variant={primaryAction.variant || "default"}
              >
                {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
                {primaryAction.loading && primaryAction.loadingLabel ? primaryAction.loadingLabel : primaryAction.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
              className={`min-h-[40px] ${primaryAction.className || 'bg-[#E5262C] hover:bg-[#c91e24] text-white'}`}
              variant={primaryAction.variant || "default"}
            >
              {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
              {primaryAction.loading && primaryAction.loadingLabel ? primaryAction.loadingLabel : primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
