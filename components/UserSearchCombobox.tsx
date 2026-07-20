"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface UserOption {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface UserSearchComboboxProps {
  value: number | null;
  textValue: string;
  onChange: (value: number | null, userData?: UserOption, textValue?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  source?: 'users' | 'redeem'; // 'users' for Users page, 'redeem' for Redeem page
}

export default function UserSearchCombobox({
  value,
  textValue,
  onChange,
  placeholder = "Search user by name...",
  disabled = false,
  source = 'users',
}: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(textValue);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Sync inputValue with textValue prop
  useEffect(() => {
    setInputValue(textValue);
  }, [textValue]);

  // Fetch users when search query changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&source=${source}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(data);
        } else {
          setOptions([]);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, source]);

  const selectedOption = options.find((opt) => opt.id === value);

  const handleSelect = (option: UserOption) => {
    onChange(option.id, option, option.name);
    setInputValue(option.name);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null, undefined, "");
    setInputValue("");
    setSearchQuery("");
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSearchQuery(newValue);
    // If user clears the input or types something different, reset the selected user
    if (!newValue || (selectedOption && newValue !== selectedOption.name)) {
      onChange(null, undefined, newValue);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[44px] pr-10"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="h-4 w-4 opacity-50" />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            {loading ? (
              <div className="text-sm text-gray-500 py-2">Searching...</div>
            ) : options.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">
                {searchQuery.trim() ? "No users found." : "Type to search users..."}
              </div>
            ) : (
              <div className="space-y-1">
                {options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.phone} — {option.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
