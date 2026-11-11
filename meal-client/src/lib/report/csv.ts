import { DAY_FULL_LABELS, DAYS } from "@/lib/days";
import type { MealGridRow } from "./grid";

/**
 * Exact spreadsheet column layout for the meal report export:
 *   A: Date | B: Student Name | C: Room Number | D: (spacer) | E–K: Saturday … Friday
 */
export const MEAL_GRID_HEADERS: readonly string[] = [
  "Date",
  "Student Name",
  "Room Number",
  "", // Column D intentionally left empty to match the standard data sheet.
  ...DAYS.map((day) => DAY_FULL_LABELS[day]),
];

const escapeCsvValue = (value: string): string => `"${value.replace(/"/g, '""')}"`;

/** Builds a UTF-8 (BOM) CSV payload using the exact A–K grid column structure. */
export function buildMealGridCsv(rows: readonly MealGridRow[]): string {
  const lines: string[] = [MEAL_GRID_HEADERS.map(escapeCsvValue).join(",")];

  for (const row of rows) {
    lines.push(
      [
        escapeCsvValue(row.weekStartDate),
        escapeCsvValue(row.studentName),
        escapeCsvValue(row.room),
        "", // Column D spacer
        ...DAYS.map((day) => escapeCsvValue(row.cells[day])),
      ].join(","),
    );
  }

  return "\uFEFF" + lines.join("\r\n");
}
