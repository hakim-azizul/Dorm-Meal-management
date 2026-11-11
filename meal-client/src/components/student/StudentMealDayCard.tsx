"use client";

import React from "react";
import { Coffee, Lock, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { StudentScheduleDay } from "@/context/MealAppContext";
import type { DayKey } from "@/lib/days";
import { FixedMealCell } from "./FixedMealCell";

export interface StudentMealDayCardProps {
  dayItem: StudentScheduleDay;
  isToday: boolean;
  isCanModifyLunch: boolean;
  isUpdating: boolean;
  onToggleLunch: (day: DayKey) => void;
}

/**
 * One operating day rendered as a single clean horizontal row:
 * Breakfast (fixed) · Lunch (interactive toggle) · Dinner (fixed).
 */
export function StudentMealDayCard({
  dayItem,
  isToday,
  isCanModifyLunch,
  isUpdating,
  onToggleLunch,
}: StudentMealDayCardProps) {
  const { t } = useLanguage();

  const dayKey = dayItem.day;
  const isLunchSelected = dayItem.lunch.selected;

  const lunchButtonClass = !isCanModifyLunch
    ? isLunchSelected
      ? "bg-primary/10 border-primary/30 text-primary opacity-80 cursor-not-allowed"
      : "bg-base-200/40 border-base-300 text-base-content/50 opacity-60 cursor-not-allowed"
    : isLunchSelected
      ? "bg-primary text-primary-content border-primary shadow-xs hover:brightness-105 active:scale-[0.98]"
      : "bg-base-100 hover:bg-base-200 border-base-300 text-base-content active:scale-[0.98]";

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all duration-150 ${
        isToday
          ? "border-primary/60 ring-1 ring-primary/20 shadow-xs"
          : "border-base-300 hover:border-base-400"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Day label with optional "Today" badge */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-32 shrink-0">
          <span className="font-extrabold text-sm sm:text-base text-base-content">
            {t(dayKey)}
          </span>
          {isToday && (
            <span className="badge badge-primary badge-xs font-black uppercase text-[9px] px-1.5 py-1">
              Today
            </span>
          )}
        </div>

        {/* Breakfast | Lunch | Dinner on a single row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 items-center">
          <FixedMealCell
            icon={<Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            label="Breakfast"
          />

          <button
            type="button"
            disabled={!isCanModifyLunch || isUpdating}
            onClick={() => onToggleLunch(dayKey)}
            className={`flex items-center justify-between gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all min-h-10 ${lunchButtonClass}`}
            title={!isCanModifyLunch ? "Lunch choice locked" : "Toggle lunch preference"}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Sun
                className={`w-3.5 h-3.5 shrink-0 ${
                  isLunchSelected && isCanModifyLunch ? "text-primary-content" : "text-amber-500"
                }`}
              />
              <span className="truncate">{isLunchSelected ? "Lunch Yes" : "No Lunch"}</span>
            </span>

            {isCanModifyLunch ? (
              <input
                type="checkbox"
                checked={isLunchSelected}
                readOnly
                className={`checkbox checkbox-xs pointer-events-none shrink-0 ${
                  isLunchSelected
                    ? "checkbox-primary bg-primary-content text-primary"
                    : "checkbox-neutral"
                }`}
              />
            ) : (
              <Lock className="w-3 h-3 text-base-content/40 shrink-0" />
            )}
          </button>

          <FixedMealCell
            icon={<Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
            label="Dinner"
          />
        </div>
      </div>
    </div>
  );
}
