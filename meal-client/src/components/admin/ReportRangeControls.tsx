"use client";

import React from "react";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { REPORT_PRESETS } from "@/lib/report/presets";
import type { ReportMealFilter, UseAdminReportReturn } from "@/hooks/useAdminReport";

export interface ReportRangeControlsProps {
  report: UseAdminReportReturn;
  onExportCsv: () => void;
}

/** Date-range presets, exact from/to inputs, meal session filter and report actions. */
export function ReportRangeControls({ report, onExportCsv }: ReportRangeControlsProps) {
  const canExport = report.gridRows.length > 0;

  return (
    <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-3.5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-base-content flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Attendance & Meal Records Export</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
            Select a date range to compile check-ins and meal bookings into the spreadsheet data
            sheet.
          </p>
        </div>

        {/* Quick range presets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {REPORT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => report.applyPreset(preset.key)}
              className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exact range form & actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-base-200">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
            From Date
          </label>
          <input
            type="date"
            value={report.fromDate}
            onChange={(event) => report.setFromDate(event.target.value)}
            className="input input-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
            To Date
          </label>
          <input
            type="date"
            value={report.toDate}
            onChange={(event) => report.setToDate(event.target.value)}
            className="input input-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
            Meal Type
          </label>
          <select
            value={report.mealFilter}
            onChange={(event) =>
              report.setMealFilter(event.target.value as ReportMealFilter)
            }
            className="select select-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast Only</option>
            <option value="lunch">Lunch Only</option>
            <option value="dinner">Dinner Only</option>
          </select>
        </div>

        <div className="flex items-end gap-1.5">
          <button
            type="button"
            disabled={report.isLoading}
            onClick={() => void report.loadReport(report.fromDate, report.toDate)}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold flex-1 gap-1.5 shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${report.isLoading ? "animate-spin" : ""}`}
            />
            <span>{report.isLoading ? "Loading..." : "Filter"}</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={!canExport}
            className="btn btn-sm bg-base-200 hover:bg-base-300 text-base-content rounded-xl text-xs font-bold gap-1 shadow-xs"
            title="Download Formatted CSV (A–K data sheet)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
