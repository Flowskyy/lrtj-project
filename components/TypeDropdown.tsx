"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TypeDropdown({ value, onChange, placeholder = "Select type" }: TypeDropdownProps) {
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeValue, setNewTypeValue] = useState("");

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/news/types");
        if (res.ok) {
          const data = await res.json();
          setTypes(data);
        }
      } catch (error) {
        console.error("Failed to fetch types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  const handleAddNewType = () => {
    if (newTypeValue.trim()) {
      onChange(newTypeValue.trim());
      setShowNewTypeInput(false);
      setNewTypeValue("");
    }
  };

  const handleCancelNewType = () => {
    setShowNewTypeInput(false);
    setNewTypeValue("");
  };

  if (showNewTypeInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={newTypeValue}
          onChange={(e) => setNewTypeValue(e.target.value)}
          placeholder="Enter new type..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddNewType();
            } else if (e.key === "Escape") {
              handleCancelNewType();
            }
          }}
          autoFocus
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddNewType}
          disabled={!newTypeValue.trim()}
          className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
          size="sm"
        >
          Add
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelNewType}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        if (val === "__add_new__") {
          setShowNewTypeInput(true);
        } else if (val !== null) {
          onChange(val);
        }
      }} 
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading types..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {types.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-[#E5262C] font-medium">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new type
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
