"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAttendanceAndMealReportAction,
  type AttendanceReportSummary,
  type ReportItemRecord,
} from "@/app/actions/reportActions";
import type { Notification } from "@/hooks/useNotification";
import { downloadTextFile } from "@/lib/download";
import { buildMealGridCsv } from "@/lib/report/csv";
import { buildMealGridRows, type MealGridRow } from "@/lib/report/grid";
import {
  getDefaultReportRange,
  resolveReportPreset,
  type ReportPreset,
} from "@/lib/report/presets";

export type ReportMealFilter = "all" | "breakfast" | "lunch" | "dinner";

interface UseAdminReportOptions {
  /** Whether the Reports tab is currently visible (drives lazy loading). */
  isActive: boolean;
  /** Notification sink shared with the dashboard shell. */
  notify: (notification: Notification, durationMs?: number) => void;
}

/**
 * Owns the whole report lifecycle: date range, presets, database fetch,
 * student/room search, meal filtering, grid pivoting and CSV export.
 */
export function useAdminReport({ isActive, notify }: UseAdminReportOptions) {
  const initialRange = useMemo(() => getDefaultReportRange(), []);

  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [records, setRecords] = useState<ReportItemRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mealFilter, setMealFilter] = useState<ReportMealFilter>("all");

  const loadReport = useCallback(
    async (from?: string, to?: string) => {
      setIsLoading(true);
      try {
        const res = await getAttendanceAndMealReportAction({
          fromDate: from || fromDate,
          toDate: to || toDate,
        });

        if (res.success && res.records && res.summary) {
          setRecords(res.records);
          setSummary(res.summary);
        } else {
          notify({ type: "error", text: res.message || "Failed to load attendance report." });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error generating report.";
        notify({ type: "error", text: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [fromDate, toDate, notify],
  );

  // Lazy-load when the Reports tab opens, and refresh whenever the range changes.
  useEffect(() => {
    if (!isActive) return;
    const run = async () => {
      await loadReport();
    };
    void run();
  }, [isActive, loadReport]);

  /** Applies a quick preset range; the range effect triggers the reload. */
  const applyPreset = useCallback((preset: ReportPreset) => {
    const range = resolveReportPreset(preset);
    setFromDate(range.from);
    setToDate(range.to);
  }, []);

  /** Records filtered by the meal session and the free-text student/room search. */
  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      if (mealFilter !== "all" && record.mealType !== mealFilter) return false;
      if (!query) return true;
      return (
        record.studentName.toLowerCase().includes(query) ||
        record.room.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query) ||
        record.date.includes(query)
      );
    });
  }, [records, searchTerm, mealFilter]);

  /** Spreadsheet rows: one per student per operating week, Sat…Fri ✓/× columns. */
  const gridRows: MealGridRow[] = useMemo(
    () => buildMealGridRows(filteredRecords, { mealType: mealFilter }),
    [filteredRecords, mealFilter],
  );

  /** Exports the current grid view using the exact A–K data sheet layout. */
  const exportCsv = useCallback(() => {
    if (!gridRows.length) {
      notify({ type: "error", text: "No records to download. Please generate a report first." });
      return;
    }

    downloadTextFile(
      buildMealGridCsv(gridRows),
      `Meal_Attendance_Report_${fromDate}_to_${toDate}.csv`,
      "text/csv;charset=utf-8;",
    );

    notify(
      { type: "success", text: `Report downloaded successfully (${gridRows.length} rows).` },
      3000,
    );
  }, [gridRows, fromDate, toDate, notify]);

  return {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    records,
    summary,
    isLoading,
    searchTerm,
    setSearchTerm,
    mealFilter,
    setMealFilter,
    filteredRecords,
    gridRows,
    loadReport,
    applyPreset,
    exportCsv,
  };
}

export type UseAdminReportReturn = ReturnType<typeof useAdminReport>;
