"use client";

import React from "react";

export interface FixedMealCellProps {
  icon: React.ReactNode;
  label: string;
}

/** Non-interactive meal cell for the daily guaranteed allotments (breakfast & dinner). */
export function FixedMealCell({ icon, label }: FixedMealCellProps) {
  return (
    <div className="flex items-center justify-center sm:justify-start gap-1.5 py-2 px-2.5 rounded-xl bg-base-200/50 border border-base-200/80 text-xs font-bold text-base-content/70 select-none">
      {icon}
      <span className="truncate">{label}</span>
      <span className="badge badge-ghost badge-xs text-[9px] font-bold ms-auto hidden md:inline-flex">
        Fixed
      </span>
    </div>
  );
}
