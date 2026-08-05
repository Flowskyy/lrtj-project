"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SearchScope {
  field: string;
  label: string;
}

interface SearchScopeSuggestionsProps {
  searchQuery: string;
  scopes: SearchScope[];
  onScopeSelect: (scope: SearchScope) => void;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export default function SearchScopeSuggestions({
  searchQuery,
  scopes,
  onScopeSelect,
  isVisible,
  onClose,
  className
}: SearchScopeSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible || scopes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < scopes.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(scopes[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (scope: SearchScope) => {
    onScopeSelect(scope);
    onClose();
    setSelectedIndex(-1);
  };

  if (!isVisible || !searchQuery.trim()) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto",
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {scopes.map((scope, index) => (
        <div
          key={scope.field}
          className={cn(
            "px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
            selectedIndex === index && "bg-gray-100"
          )}
          onClick={() => handleSelect(scope)}
        >
          <div className="text-sm font-medium text-gray-900">
            Search "{searchQuery}" by {scope.label}
          </div>
        </div>
      ))}
    </div>
  );
}
