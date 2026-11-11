"use client";

import React from "react";
import type { AttendanceReportSummary } from "@/app/actions/reportActions";

export interface ReportSummaryCardsProps {
  summary: AttendanceReportSummary;
}

interface SummaryCard {
  label: string;
  value: number;
  sublabel: string;
  accentClass: string;
}

/** High-level KPI strip for the compiled date range. */
export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const cards: SummaryCard[] = [
    {
      label: "Range Slots",
      value: summary.totalRecords,
      sublabel: `Across ${summary.totalStudents} students`,
      accentClass: "text-base-content",
    },
    {
      label: "Meals Served",
      value: summary.totalPresent,
      sublabel: "Verified Present",
      accentClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Missed Lunches",
      value: summary.totalLunchesMissed,
      sublabel: "Booked but Absent",
      accentClass: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Lunches Booked",
      value: summary.totalLunchesBooked,
      sublabel: "Opt-in lunches",
      accentClass: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Red-Flagged",
      value: summary.flaggedCount,
      sublabel: "Active disciplinary flags",
      accentClass: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Unmarked Slots",
      value: summary.totalUnmarked,
      sublabel: "Pending chef check-in",
      accentClass: "text-base-content/70",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs"
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider block ${card.accentClass}`}
          >
            {card.label}
          </span>
          <span
            className={`text-lg font-black mt-0.5 block ${card.accentClass}`}
          >
            {card.value}
          </span>
          <span className="text-[10px] text-base-content/60">{card.sublabel}</span>
        </div>
      ))}
    </div>
  );
}
