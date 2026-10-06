"use client";

/**
 * AzureTaskSearchBar — the search box on its own (extracted from the old
 * result-summary strip). Ctrl/⌘+K focuses it from anywhere on the page,
 * Escape clears it (or blurs when empty).
 */

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface AzureTaskSearchBarProps {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function AzureTaskSearchBar({
  value,
  onChange,
  placeholder,
  className,
}: AzureTaskSearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [mac, setMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== "undefined") {
      setMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (value) {
          e.preventDefault();
          onChange(undefined);
        } else {
          inputRef.current?.blur();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [value, onChange]);

  const active = Boolean(value);

  return (
    <div
      className={cn(
        "group relative flex items-center w-full",
        "bg-white border border-gray-200 rounded-2xl shadow-sm px-3 transition-all",
        "focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/60",
        active && "bg-blue-50/30 border-blue-300",
        className,
      )}
    >
      <Search
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          active ? "text-blue-600" : "text-gray-400 group-focus-within:text-blue-600",
        )}
      />
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search work items"
        placeholder={placeholder ?? "Search by title, id, tag, or assignee…"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="flex-1 min-w-0 bg-transparent outline-none border-0 h-10 text-sm text-gray-900 placeholder:text-gray-400 px-2"
      />
      {active ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange(undefined);
            inputRef.current?.focus();
          }}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
      <kbd
        aria-hidden
        className={cn(
          "hidden lg:inline-flex items-center px-1.5 h-5 ml-1 rounded-md border border-gray-200 bg-white text-[10px] font-mono font-semibold text-gray-500 select-none",
          active && "opacity-0 pointer-events-none",
        )}
      >
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </div>
  );
}
