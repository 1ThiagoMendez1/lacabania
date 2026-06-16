"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar plato..."
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="relative w-full" 
        onClick={() => {
          if (!open) {
            setOpen(true);
            setSearchQuery("");
            setTimeout(() => inputRef.current?.focus(), 10);
          } else {
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 z-10 text-foreground" />
        <input
          ref={inputRef}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          placeholder={selectedOption && !open ? selectedOption.label : searchPlaceholder}
          value={open ? searchQuery : (selectedOption ? selectedOption.label : "")}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          readOnly={!open}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none text-foreground" />
      </div>

      {open && (
        <div className="absolute z-[9999] top-full mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 max-h-60 overflow-y-auto overflow-x-hidden">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron resultados.</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                    value === option.value && "bg-accent text-accent-foreground font-medium"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onValueChange(option.value);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
