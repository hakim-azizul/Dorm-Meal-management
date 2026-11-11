"use client";

import React from "react";
import { CalendarDays, Info } from "lucide-react";

export interface StudentWeekHeaderProps {
  isCanModifyLunch: boolean;
  isGlobalLocked: boolean;
  selectedLunchesCount: number;
}

/** Weekly selection status bar, lunch counter and the fixed-meal policy hint. */
export function StudentWeekHeader({
  isCanModifyLunch,
  isGlobalLocked,
  selectedLunchesCount,
}: StudentWeekHeaderProps) {
  const statusBadgeClass = isCanModifyLunch
    ? "badge-success text-success-content"
    : isGlobalLocked
      ? "badge-error text-white"
      : "badge-ghost text-base-content/70";

  const statusLabel = isCanModifyLunch
    ? "Selection Open"
    : isGlobalLocked
      ? "Frozen (Global Lock)"
      : "Suspended";

  const statusDescription = isCanModifyLunch
    ? "Meal selections are currently unlocked. Customize your lunch choices below."
    : isGlobalLocked
      ? "Meal choices are frozen by administration. You can view your schedule below."
      : "Meal privileges are suspended. Contact hostel warden.";

  return (
    <>
      <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-base-content">
                Weekly Meal Selection
              </span>
              <span
                className={`badge badge-sm font-black text-[10px] uppercase py-2 px-2.5 ${statusBadgeClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
              {statusDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-base-100 border border-base-300 text-xs font-bold text-base-content">
            <span>Lunches: </span>
            <span className="text-primary font-black">{selectedLunchesCount}</span>
            <span className="text-base-content/50">/7</span>
          </div>
        </div>
      </div>

      {/* Policy micro-hint */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-base-content/60">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Breakfast &amp; Dinner are daily guarantees. Toggle Lunch below as needed.
        </span>
      </div>
    </>
  );
}
