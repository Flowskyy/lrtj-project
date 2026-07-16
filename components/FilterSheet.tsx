"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  sortByOptions?: { value: string; label: string }[];
}

export default function FilterSheet({
  open,
  onOpenChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  sortByOptions = [
    { value: "id", label: "ID" },
    { value: "createdAt", label: "Created Date" },
    { value: "editedBy", label: "Edited By" },
  ],
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-80 p-0">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v || 'all')}>
                <SelectTrigger className="min-h-[44px]">
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v || 'id')}>
                <SelectTrigger className="min-h-[44px]">
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Order</label>
              <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v || 'asc')}>
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
              onClick={() => onOpenChange(false)}
              className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
