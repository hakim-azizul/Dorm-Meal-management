"use client";

import React from "react";
import { ChefHat, Download, FileSpreadsheet, UserPlus, Users } from "lucide-react";
import { AdminTabButton } from "./AdminTabButton";
import type { AdminTab } from "./types";

export interface AdminControlBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  studentCount: number;
  chefCount: number;
  penalizedCount: number;
  redFlagCount: number;
  onAddStudent: () => void;
  onAddChef: () => void;
  onDownloadCsv: () => void;
  canDownloadCsv: boolean;
}

/** Top segmented control combining tab navigation, roster KPIs and contextual actions. */
export function AdminControlBar({
  activeTab,
  onTabChange,
  studentCount,
  chefCount,
  penalizedCount,
  redFlagCount,
  onAddStudent,
  onAddChef,
  onDownloadCsv,
  canDownloadCsv,
}: AdminControlBarProps) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
      {/* Tabs: Students / Chefs / Reports */}
      <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300 shrink-0 overflow-x-auto">
        <AdminTabButton
          label={`Students (${studentCount})`}
          icon={Users}
          isActive={activeTab === "students"}
          onClick={() => onTabChange("students")}
        />
        <AdminTabButton
          label={`Chefs (${chefCount})`}
          icon={ChefHat}
          isActive={activeTab === "chefs"}
          onClick={() => onTabChange("chefs")}
        />
        <AdminTabButton
          label="Reports & Downloads"
          icon={FileSpreadsheet}
          isActive={activeTab === "reports"}
          onClick={() => onTabChange("reports")}
        />
      </div>

      {/* Quick Metrics & Contextual Actions */}
      <div className="flex items-center gap-2 justify-between sm:justify-end">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="badge badge-sm badge-error text-white font-bold gap-1">
            {penalizedCount} Suspended
          </span>
          <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold gap-1 text-[11px]">
            {redFlagCount} Flagged
          </span>
        </div>

        {activeTab === "students" && (
          <button
            type="button"
            onClick={onAddStudent}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        )}

        {activeTab === "chefs" && (
          <button
            type="button"
            onClick={onAddChef}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Chef</span>
          </button>
        )}

        {activeTab === "reports" && (
          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={!canDownloadCsv}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
