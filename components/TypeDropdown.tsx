"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Fixed type options as per project requirements
const TYPE_OPTIONS = ["News", "Pers"];

export default function TypeDropdown({ value, onChange, placeholder = "Select type" }: TypeDropdownProps) {
  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        if (val !== null) {
          onChange(val);
        }
      }} 
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TYPE_OPTIONS.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
