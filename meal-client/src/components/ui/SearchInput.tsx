"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label announced for screen readers. */
  label?: string;
  size?: "sm" | "xs";
  /** Extra classes for the inner input (background, rounding, …). */
  inputClassName?: string;
  className?: string;
}

/**
 * Reusable debounced-free search field with leading icon and clear affordance.
 * Shared by the admin roster, chef roster, sidebar quick-find and report preview.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label = "Search",
  size = "sm",
  inputClassName = "bg-base-100 rounded-xl",
  className = "",
}: SearchInputProps) {
  const metrics =
    size === "sm"
      ? {
          input: "input-sm ps-9 pe-8",
          icon: "w-4 h-4 inset-s-3 top-2.5",
          clear: "inset-e-2.5 top-2.5",
          clearIcon: "w-3.5 h-3.5",
        }
      : {
          input: "input-xs ps-7 pe-7",
          icon: "w-3 h-3 inset-s-2 top-2",
          clear: "inset-e-1.5 top-1.5",
          clearIcon: "w-3 h-3",
        };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`input w-full border-base-300 text-xs font-medium ${metrics.input} ${inputClassName}`}
      />
      <Search
        className={`${metrics.icon} text-base-content/40 pointer-events-none absolute`}
        aria-hidden="true"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={`absolute ${metrics.clear} text-base-content/40 hover:text-base-content`}
        >
          <X className={metrics.clearIcon} />
        </button>
      )}
    </div>
  );
}
