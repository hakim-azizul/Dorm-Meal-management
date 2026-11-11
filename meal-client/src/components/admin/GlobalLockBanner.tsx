"use client";

import React from "react";
import { Lock, Unlock } from "lucide-react";

export interface GlobalLockBannerProps {
  isGlobalLocked: boolean;
  onToggle: () => void;
}

/**
 * Prominent system-wide meal selection lock indicator with its freeze / re-open control.
 * Rendered at the top of every warden dashboard view.
 */
export function GlobalLockBanner({ isGlobalLocked, onToggle }: GlobalLockBannerProps) {
  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
        isGlobalLocked
          ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isGlobalLocked
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isGlobalLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-amber-500 text-sm sm:text-base">
              {isGlobalLocked
                ? "Global Selection: FROZEN (LOCKED)"
                : "Global Selection: ACTIVE (UNLOCKED)"}
            </span>
            <span
              className={`badge badge-sm font-black text-[10px] uppercase py-2 px-2.5 ${
                isGlobalLocked ? "badge-error text-white" : "badge-success text-success-content"
              }`}
            >
              {isGlobalLocked ? "Frozen" : "Open for Students"}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-500 font-semibold mt-0.5">
            {isGlobalLocked
              ? "Student meal choices are currently frozen across the system. Students cannot modify selections."
              : "Students can freely customize and save their meal selections. Toggle to freeze whenever needed."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`btn btn-sm rounded-xl font-bold text-xs shrink-0 self-start sm:self-center border-none shadow-xs text-white ${
          isGlobalLocked
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700"
        }`}
      >
        {isGlobalLocked ? (
          <>
            <Unlock className="w-4 h-4" />
            <span>Re-Open Selections</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Freeze Selections</span>
          </>
        )}
      </button>
    </div>
  );
}
