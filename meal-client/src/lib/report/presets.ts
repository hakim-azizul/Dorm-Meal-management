import { getWeekStartDate, toISODate } from "@/lib/days";

export type ReportPreset = "today" | "yesterday" | "thisWeek" | "last7" | "last30";

export interface DateRange {
  from: string;
  to: string;
}

/** Quick date-range shortcuts offered in the report filter bar. */
export const REPORT_PRESETS: ReadonlyArray<{ key: ReportPreset; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisWeek", label: "This Week" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
];

const daysAgo = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(date.getDate() - days);
  return copy;
};

/** Resolves a preset shortcut into an exact inclusive "YYYY-MM-DD" range. */
export function resolveReportPreset(preset: ReportPreset, now = new Date()): DateRange {
  switch (preset) {
    case "today": {
      const today = toISODate(now);
      return { from: today, to: today };
    }
    case "yesterday": {
      const yesterday = toISODate(daysAgo(now, 1));
      return { from: yesterday, to: yesterday };
    }
    case "thisWeek": {
      const from = getWeekStartDate(toISODate(now));
      const weekEnd = new Date(`${from}T00:00:00Z`);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      return { from, to: toISODate(weekEnd) };
    }
    case "last7":
      return { from: toISODate(daysAgo(now, 6)), to: toISODate(now) };
    case "last30":
      return { from: toISODate(daysAgo(now, 29)), to: toISODate(now) };
  }
}

/** Default report window: the last 7 days up to today. */
export function getDefaultReportRange(): DateRange {
  return resolveReportPreset("last7");
}
