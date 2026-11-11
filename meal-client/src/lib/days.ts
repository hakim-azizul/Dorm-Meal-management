/**
 * Shared weekday & calendar helpers for the fixed Saturday → Friday operating cycle.
 * All dates are handled as UTC "YYYY-MM-DD" strings to avoid local timezone drift.
 */

export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

/** Canonical weekday ordering used across schedules, grids and exports. */
export const DAYS: DayKey[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

/** Full English weekday labels (column headers for reports & exports). */
export const DAY_FULL_LABELS: Record<DayKey, string> = {
  sat: "Saturday",
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

const DAY_KEY_BY_WEEKDAY_INDEX: Record<number, DayKey> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

/** Formats a Date as a UTC "YYYY-MM-DD" string. */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Maps a "YYYY-MM-DD" date string to its weekday key (sat … fri). */
export function dayKeyOf(dateStr: string): DayKey {
  const weekdayIndex = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return DAY_KEY_BY_WEEKDAY_INDEX[weekdayIndex] ?? "mon";
}

/** Returns the Saturday ("YYYY-MM-DD") that starts the operating week containing dateStr. */
export function getWeekStartDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const weekdayIndex = date.getUTCDay();
  const diffToSaturday = weekdayIndex === 6 ? 0 : -(weekdayIndex + 1);
  const saturday = new Date(date);
  saturday.setUTCDate(date.getUTCDate() + diffToSaturday);
  return toISODate(saturday);
}

/**
 * Expands an inclusive from/to range into chronological "YYYY-MM-DD" strings.
 * Guarded to a maximum of `maxDays` entries to keep report generation bounded.
 */
export function expandDateRange(fromDate: string, toDate: string, maxDays = 90): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);

  let guard = 0;
  while (cursor <= end && guard < maxDays) {
    dates.push(toISODate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard++;
  }
  return dates;
}
