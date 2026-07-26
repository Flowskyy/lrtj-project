"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Filter, Check } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  label: string;
  key: string;
  options: FilterOption[];
}

export interface SortOption {
  label: string;
  value: string;
}

interface TableFilterSortMenuProps {
  filterGroups: FilterGroup[];
  sortOptions: SortOption[];
  currentFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  currentSortBy: string;
  onSortByChange: (value: string) => void;
  currentSortOrder: string;
  onSortOrderChange: (value: string) => void;
  activeFilterCount: number;
}

export default function TableFilterSortMenu({
  filterGroups,
  sortOptions,
  currentFilters,
  onFilterChange,
  currentSortBy,
  onSortByChange,
  currentSortOrder,
  onSortOrderChange,
  activeFilterCount,
}: TableFilterSortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-[44px] relative">
        <Filter className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-white text-[10px] p-0 rounded-full">
            {activeFilterCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {filterGroups.map((group, groupIndex) => (
          <div key={group.key}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {group.options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange(group.key, option.value)}
              >
                <div className="flex items-center gap-2">
                  {currentFilters[group.key] === option.value && <Check className="h-4 w-4" />}
                  <span>{option.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
            {groupIndex < filterGroups.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSortByChange(option.value)}>
            <div className="flex items-center gap-2">
              {currentSortBy === option.value && <Check className="h-4 w-4" />}
              <span>{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSortOrderChange("asc")}>
          <div className="flex items-center gap-2">
            {currentSortOrder === "asc" && <Check className="h-4 w-4" />}
            <span>Ascending</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortOrderChange("desc")}>
          <div className="flex items-center gap-2">
            {currentSortOrder === "desc" && <Check className="h-4 w-4" />}
            <span>Descending</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
