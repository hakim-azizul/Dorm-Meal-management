"use client";

import React from "react";
import { Search } from "lucide-react";
import { DAY_FULL_LABELS, DAYS } from "@/lib/days";
import type { MealGridRow } from "@/lib/report/grid";

export interface MealReportGridProps {
  rows: MealGridRow[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  fromDate: string;
  toDate: string;
}

const MARK_STYLES: Record<string, string> = {
  "✓": "text-emerald-600 dark:text-emerald-400",
  "×": "text-rose-600 dark:text-rose-400",
};

/** Spreadsheet column letters mirroring the standard data sheet (A → K). */
const COLUMN_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

/**
 * Direct table preview of the meal report in the standard data-sheet layout:
 *   A: Date · B: Student Name · C: Room Number · D: spacer · E–K: Sat … Fri ✓/× marks.
 */
export function MealReportGrid({
  rows,
  isLoading,
  searchTerm,
  onSearchChange,
  fromDate,
  toDate,
}: MealReportGridProps) {
  return (
    <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-3 shadow-xs">
      {/* Preview header: title, legend, search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-base-content">Meal Report Data Sheet</span>
          <span className="badge badge-sm bg-base-200 text-base-content font-bold text-[10px]">
            {rows.length} rows
          </span>
          <span className="badge badge-sm badge-ghost font-bold text-[10px] gap-1">
            <span className="text-emerald-600 dark:text-emerald-400">✓</span> Attended
          </span>
          <span className="badge badge-sm badge-ghost font-bold text-[10px] gap-1">
            <span className="text-rose-600 dark:text-rose-400">×</span> Missed
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by student name or room..."
            aria-label="Search report preview"
            className="input input-xs w-full bg-base-200/60 rounded-lg ps-7 pe-2 text-xs border-base-300"
          />
          <Search
            className="w-3 h-3 text-base-content/40 absolute inset-s-2 top-2 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="text-[11px] text-base-content/60">
        Week rows for <span className="font-bold">{fromDate}</span> →{" "}
        <span className="font-bold">{toDate}</span>. Blank cells mean attendance is still pending
        or the meal was not booked.
      </p>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <span className="loading loading-spinner loading-md text-emerald-600" />
          <p className="text-xs text-base-content/60">
            Compiling date range records from database...
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-xs text-base-content/60">
          No records found for the selected date range and filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-120 border border-base-200 rounded-xl">
          <table className="table table-xs w-full">
            <thead className="sticky top-0 z-10">
              {/* Spreadsheet column letters (A → K) */}
              <tr className="bg-base-300/70 text-base-content/60">
                {COLUMN_LETTERS.map((letter) => (
                  <th
                    key={letter}
                    className={`text-center font-black text-[9px] uppercase tracking-widest ${
                      letter === "D" ? "w-6 bg-base-300/60" : ""
                    }`}
                  >
                    {letter}
                  </th>
                ))}
              </tr>
              {/* Data sheet headers */}
              <tr className="bg-base-200 text-base-content/70 border-b border-base-300">
                <th>Date</th>
                <th>Student Name</th>
                <th>Room Number</th>
                <th className="bg-base-200/70" aria-label="Spacer column" />
                {DAYS.map((day) => (
                  <th key={day} className="text-center">
                    {DAY_FULL_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.weekStartDate}-${row.studentId}`}
                  className="hover:bg-base-200/40"
                >
                  <td className="font-semibold whitespace-nowrap text-base-content">
                    {row.weekStartDate}
                  </td>
                  <td className="font-bold text-base-content">{row.studentName}</td>
                  <td className="font-semibold">{row.room}</td>
                  <td className="bg-base-200/30" aria-hidden="true" />
                  {DAYS.map((day) => (
                    <td key={day} className="text-center font-black text-sm">
                      {row.cells[day] ? (
                        <span className={MARK_STYLES[row.cells[day]]}>{row.cells[day]}</span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
