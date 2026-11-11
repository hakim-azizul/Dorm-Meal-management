"use client";

import React from "react";

export interface AdminTabButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

/** Single segmented-control button used by the Students / Chefs / Reports tabs. */
export function AdminTabButton({ label, icon: Icon, isActive, onClick }: AdminTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
        isActive
          ? "bg-emerald-600 text-white shadow-xs"
          : "text-base-content/70 hover:bg-base-200"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
