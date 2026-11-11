"use client";

import React from "react";
import { ChefHat } from "lucide-react";
import type { MealType } from "@/context/MealAppContext";

export interface ChefSessionBarProps {
  activeSession: MealType;
  onSessionChange: (session: MealType) => void;
  todayDateFormatted: string;
}

const SESSIONS: readonly MealType[] = ["breakfast", "lunch", "dinner"];

const SESSION_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch (Pre-Selected)",
  dinner: "Dinner",
};

/** Operating-date header with the Breakfast / Lunch / Dinner session switcher. */
export function ChefSessionBar({
  activeSession,
  onSessionChange,
  todayDateFormatted,
}: ChefSessionBarProps) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <ChefHat className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-base-content capitalize">
              {activeSession} Session
            </span>
            <span className="badge badge-accent badge-xs font-black uppercase text-[9px] px-2 py-1">
              Today Only
            </span>
          </div>
          <p className="text-[11px] text-base-content/60 mt-0.5">{todayDateFormatted}</p>
        </div>
      </div>

      {/* Session switcher pills */}
      <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300 shrink-0 self-start sm:self-center">
        {SESSIONS.map((session) => (
          <button
            key={session}
            type="button"
            onClick={() => onSessionChange(session)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSession === session
                ? "bg-accent text-accent-content shadow-xs"
                : "text-base-content/70 hover:bg-base-200"
            }`}
          >
            {SESSION_LABELS[session]}
          </button>
        ))}
      </div>
    </div>
  );
}
