import type { ReportItemRecord, AttendanceStatus } from "@/app/actions/reportActions";
import { dayKeyOf, getWeekStartDate, type DayKey } from "@/lib/days";

/** Cell mark used in the spreadsheet-style meal report. Blank = pending / not booked. */
export type MealGridMark = "✓" | "×" | "";

/**
 * One spreadsheet row: a student's operating week.
 * Column A → weekStartDate, Column B → studentName, Column C → room,
 * Columns E–K → per-weekday attendance marks.
 */
export interface MealGridRow {
  weekStartDate: string;
  studentId: string;
  studentName: string;
  room: string;
  cells: Record<DayKey, MealGridMark>;
}

export interface MealGridOptions {
  /** Restrict marks to a single meal session, or keep every session. */
  mealType: "all" | "breakfast" | "lunch" | "dinner";
}

const createEmptyCells = (): Record<DayKey, MealGridMark> => ({
  sat: "",
  sun: "",
  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
});

/**
 * Collapses every meal session of a single weekday into one mark:
 * × → at least one meal recorded absent (missed),
 * ✓ → at least one meal recorded present (attended),
 * "" → nothing recorded yet (pending) or the meal was never booked.
 */
function aggregateDayMark(statuses: readonly AttendanceStatus[]): MealGridMark {
  if (statuses.includes("absent")) return "×";
  if (statuses.includes("present")) return "✓";
  return "";
}

/**
 * Transforms the flat date-range records returned by the report action into
 * the spreadsheet layout: one row per student per operating week, with a
 * Saturday → Friday column of ✓ / × marks.
 *
 * Row order: chronological by week start date, students kept in their
 * name/room roster order within each week.
 */
export function buildMealGridRows(
  records: readonly ReportItemRecord[],
  options: MealGridOptions,
): MealGridRow[] {
  const rowsByKey = new Map<string, MealGridRow>();
  const statusesByKey = new Map<string, Map<DayKey, AttendanceStatus[]>>();

  for (const record of records) {
    if (options.mealType !== "all" && record.mealType !== options.mealType) continue;

    const weekStartDate = getWeekStartDate(record.date);
    const rowKey = `${weekStartDate}|${record.studentId}`;

    if (!rowsByKey.has(rowKey)) {
      rowsByKey.set(rowKey, {
        weekStartDate,
        studentId: record.studentId,
        studentName: record.studentName,
        room: record.room,
        cells: createEmptyCells(),
      });
      statusesByKey.set(rowKey, new Map());
    }

    const dayKey = dayKeyOf(record.date);
    const perDay = statusesByKey.get(rowKey);
    if (!perDay) continue;

    const dayStatuses = perDay.get(dayKey) ?? [];
    dayStatuses.push(record.attendanceStatus);
    perDay.set(dayKey, dayStatuses);
  }

  rowsByKey.forEach((row, rowKey) => {
    const perDay = statusesByKey.get(rowKey);
    perDay?.forEach((statuses, dayKey) => {
      row.cells[dayKey] = aggregateDayMark(statuses);
    });
  });

  return Array.from(rowsByKey.values()).sort((a, b) =>
    a.weekStartDate.localeCompare(b.weekStartDate),
  );
}
