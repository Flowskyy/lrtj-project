"use client";

import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MerchandiseOption {
  id: number;
  name: string;
}

interface MerchandiseSearchComboboxProps {
  options: MerchandiseOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MerchandiseSearchCombobox({
  options,
  value,
  onChange,
  placeholder = "Select merchandise",
  disabled = false,
}: MerchandiseSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full justify-between min-h-[44px] px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md inline-flex items-center",
          !value && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {selectedOption ? selectedOption.name : placeholder}
        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search merchandise..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No merchandise found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
