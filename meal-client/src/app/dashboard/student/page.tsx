"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp, DayKey } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  Lock,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  ShieldAlert,
  CalendarDays,
  Info,
} from "lucide-react";

export default function StudentDashboard() {
  const { t } = useLanguage();
  const {
    currentUser,
    studentSchedule,
    toggleStudentLunch,
    isGlobalLocked,
    isFriday,
    systemDay,
    isHydrated,
    isSidebarOpen,
    closeSidebar,
  } = useMealApp();

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLunchCheckboxChange = async (day: DayKey) => {
    if (!isFriday || isGlobalLocked || currentUser?.isBlocked) return;

    setIsUpdating(true);
    try {
      const res = await toggleStudentLunch(day);
      if (res.success) {
        setNotification({ type: "success", text: res.message });
      } else {
        setNotification({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update lunch choice";
      setNotification({ type: "error", text: errorMsg });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const selectedLunchesCount = studentSchedule.filter((d) => d.lunch.selected).length;
  const isStudentBlocked = currentUser?.isBlocked;
  const isCanModifyLunch = isFriday && !isGlobalLocked && !isStudentBlocked;

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-base-100">
      {/* 1. Responsive Sidebar with User Profile (Section 1) & Nav (Section 2) */}
      <DashboardSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* 2. Main Student Dashboard Area */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-4">
        {/* Status Alerts (Only if active) */}
        {isStudentBlocked && (
          <AlertBanner
            type="error"
            title="Meal Privileges Suspended"
            message={`Privileges suspended: ${currentUser?.penaltyReason || "Administrative hold"}`}
            icon={<ShieldAlert className="w-5 h-5 shrink-0 text-white" />}
          />
        )}

        {currentUser?.isRedFlagged && (
          <AlertBanner
            type="error"
            title="Absence Red Flag"
            message="Unexcused missed lunch. Check in with mess chef on your next meal to clear."
            icon={<AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />}
          />
        )}

        {isGlobalLocked && (
          <AlertBanner
            type="warning"
            title="Global Lock Active"
            message="All meal selections are currently frozen by the administration."
            icon={<Lock className="w-5 h-5 shrink-0 text-amber-900" />}
          />
        )}

        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Minimalist Cycle & Selection Status Bar */}
        <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-base-content">
                  {isFriday ? "Upcoming Week Selection" : "Current Week Schedule"}
                </span>
                <span
                  className={`badge badge-sm font-black text-[10px] uppercase py-2 px-2.5 ${
                    isCanModifyLunch
                      ? "badge-success text-success-content"
                      : "badge-ghost text-base-content/70"
                  }`}
                >
                  {isCanModifyLunch ? "Friday Open" : "Locked (Friday Only)"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
                {isFriday
                  ? "Selections apply to the upcoming week (Saturday through Friday)."
                  : `Operating week cycle. Next selection window opens on Friday.`}
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

        {/* Policy Micro-Hint */}
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-base-content/60">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Breakfast & Dinner are daily guarantees. Toggle Lunch below on Fridays.</span>
        </div>

        {/* Redesigned Daily Cards: Vertically Stacked with Single Horizontal Meal Row */}
        <div className="space-y-2.5">
          {studentSchedule.map((dayItem) => {
            const dayKey = dayItem.day;
            const isLunchSelected = dayItem.lunch.selected;
            const isToday = systemDay === dayKey;

            return (
              <div
                key={dayKey}
                className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all duration-150 ${
                  isToday
                    ? "border-primary/60 ring-1 ring-primary/20 shadow-xs"
                    : "border-base-300 hover:border-base-400"
                }`}
              >
                {/* Single Clean Line Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                  {/* Day Label with optional Today badge */}
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

                  {/* Single Row: Breakfast (Fixed) | Lunch (Interactive Toggle) | Dinner (Fixed) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 items-center">
                    {/* 1. Breakfast (Fixed) */}
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 py-2 px-2.5 rounded-xl bg-base-200/50 border border-base-200/80 text-xs font-bold text-base-content/70 select-none">
                      <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Breakfast</span>
                      <span className="badge badge-ghost badge-xs text-[9px] font-bold ms-auto hidden md:inline-flex">
                        Fixed
                      </span>
                    </div>

                    {/* 2. Lunch (Interactive Toggle in the Middle) */}
                    <button
                      type="button"
                      disabled={!isCanModifyLunch || isUpdating}
                      onClick={() => handleLunchCheckboxChange(dayKey)}
                      className={`flex items-center justify-between gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all min-h-[2.5rem] ${
                        !isCanModifyLunch
                          ? isLunchSelected
                            ? "bg-primary/10 border-primary/30 text-primary opacity-80 cursor-not-allowed"
                            : "bg-base-200/40 border-base-300 text-base-content/50 opacity-60 cursor-not-allowed"
                          : isLunchSelected
                          ? "bg-primary text-primary-content border-primary shadow-xs hover:brightness-105 active:scale-[0.98]"
                          : "bg-base-100 hover:bg-base-200 border-base-300 text-base-content active:scale-[0.98]"
                      }`}
                      title={!isCanModifyLunch ? "Lunch choice locked (Fridays only)" : "Toggle lunch preference"}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Sun
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isLunchSelected && isCanModifyLunch
                              ? "text-primary-content"
                              : "text-amber-500"
                          }`}
                        />
                        <span className="truncate">
                          {isLunchSelected ? "Lunch Yes" : "No Lunch"}
                        </span>
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

                    {/* 3. Dinner (Fixed) */}
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 py-2 px-2.5 rounded-xl bg-base-200/50 border border-base-200/80 text-xs font-bold text-base-content/70 select-none">
                      <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Dinner</span>
                      <span className="badge badge-ghost badge-xs text-[9px] font-bold ms-auto hidden md:inline-flex">
                        Fixed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
