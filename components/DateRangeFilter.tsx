"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangeFilterProps {
  dateField: string;
  onDateFieldChange: (value: string | null) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  dateFieldOptions: { label: string; value: string }[];
}

export default function DateRangeFilter({
  dateField,
  onDateFieldChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  dateFieldOptions,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={dateField} onValueChange={onDateFieldChange}>
        <SelectTrigger className="h-9 w-[140px] min-h-[44px] text-xs">
          <SelectValue placeholder="Date field" />
        </SelectTrigger>
        <SelectContent>
          {dateFieldOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="h-9 w-[130px] min-h-[44px] text-xs"
      />
      <span className="text-xs text-gray-500">to</span>
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="h-9 w-[130px] min-h-[44px] text-xs"
      />
    </div>
  );
}
