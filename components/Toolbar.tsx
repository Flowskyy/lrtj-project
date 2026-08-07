"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Columns, X } from "lucide-react";

export interface ColumnConfig {
  [key: string]: {
    label: string;
  };
}

export interface FilterConfig {
  statusFilter?: string;
  onStatusFilterChange?: (value: string | null) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string | null) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string | null) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  typeOptions?: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string }>;
  showStatusFilter?: boolean;
  showTypeFilter?: boolean;
  showCategoryFilter?: boolean;
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
  showDateRange?: boolean;
  onResetFilters?: () => void;
  activeFilterCount?: number;
}

export interface SortConfig {
  sortBy: string;
  onSortByChange: (value: string | null) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc" | null) => void;
  sortByOptions: Array<{ value: string; label: string }>;
}

interface ToolbarProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  columnConfig?: ColumnConfig;
  filterConfig?: FilterConfig;
  sortConfig?: SortConfig;
  visibleColumns?: { [key: string]: boolean };
  onColumnVisibilityToggle?: (key: string) => void;
}

export default function Toolbar({
  searchQuery = "",
  onSearchChange,
  columnConfig,
  filterConfig,
  sortConfig,
  visibleColumns,
  onColumnVisibilityToggle,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* Search and Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters Row */}
      {filterConfig && (
        <div className="flex flex-wrap gap-3 items-center">
          {filterConfig.showStatusFilter && filterConfig.statusOptions && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status:</Label>
              <Select
                value={filterConfig.statusFilter}
                onValueChange={(value) => filterConfig.onStatusFilterChange?.(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {filterConfig.statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showTypeFilter && filterConfig.typeOptions && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Type:</Label>
              <Select
                value={filterConfig.typeFilter}
                onValueChange={(value) => filterConfig.onTypeFilterChange?.(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {filterConfig.typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showCategoryFilter && filterConfig.categoryOptions && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Category:</Label>
              <Select
                value={filterConfig.categoryFilter}
                onValueChange={(value) => filterConfig.onCategoryFilterChange?.(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filterConfig.categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showDateRange && (
            <>
              <div className="flex items-center gap-2">
                <Label className="text-sm">From:</Label>
                <Input
                  type="date"
                  value={filterConfig.dateFrom}
                  onChange={(e) => filterConfig.onDateFromChange?.(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">To:</Label>
                <Input
                  type="date"
                  value={filterConfig.dateTo}
                  onChange={(e) => filterConfig.onDateToChange?.(e.target.value)}
                  className="w-[150px]"
                />
              </div>
            </>
          )}

          {filterConfig.activeFilterCount !== undefined && filterConfig.activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={filterConfig.onResetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filters ({filterConfig.activeFilterCount})
            </Button>
          )}
        </div>
      )}

      {/* Sort Row */}
      {sortConfig && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Sort by:</Label>
            <Select value={sortConfig.sortBy} onValueChange={(value) => sortConfig.onSortByChange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {sortConfig.sortByOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sortConfig.sortOrder} onValueChange={(value) => sortConfig.onSortOrderChange(value as "asc" | "desc")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Column Visibility Row */}
      {columnConfig && visibleColumns && onColumnVisibilityToggle && (
        <div className="flex flex-wrap gap-2 items-center">
          <Columns className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm">Show columns:</Label>
          {Object.entries(columnConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={visibleColumns[key] ? "default" : "outline"}
              size="sm"
              onClick={() => onColumnVisibilityToggle(key)}
              className="h-8"
            >
              {config.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
