"use server";

import { getDatabase } from "@/lib/mongodb";
import { dayKeyOf, expandDateRange, getWeekStartDate, type DayKey } from "@/lib/days";

export type AttendanceStatus = "present" | "absent" | "unmarked";
export type MealType = "breakfast" | "lunch" | "dinner";

export interface ReportItemRecord {
  id: string;
  studentId: string;
  studentName: string;
  room: string;
  email: string;
  isBlocked: boolean;
  isRedFlagged: boolean;
  penaltyReason?: string;
  date: string;
  day: DayKey;
  mealType: MealType;
  booked: boolean;
  attendanceStatus: AttendanceStatus;
}

export interface AttendanceReportSummary {
  fromDate: string;
  toDate: string;
  totalStudents: number;
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  totalUnmarked: number;
  totalLunchesBooked: number;
  totalLunchesAttended: number;
  totalLunchesMissed: number;
  totalBreakfastsAttended: number;
  totalDinnersAttended: number;
  flaggedCount: number;
  blockedCount: number;
}

export interface AttendanceReportResult {
  success: boolean;
  message?: string;
  summary?: AttendanceReportSummary;
  records?: ReportItemRecord[];
}

const MEAL_TYPES: readonly MealType[] = ["breakfast", "lunch", "dinner"];

const DEFAULT_LUNCH_PREFERENCES: Record<string, boolean> = {
  sat: true,
  sun: true,
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: false,
};

/**
 * Compiles the granular date-range attendance & meal report straight from
 * MongoDB Atlas: one record per student, per date, per meal session.
 *
 * Consumers (admin grid preview + CSV export) pivot these records into the
 * spreadsheet layout via `buildMealGridRows`.
 */
export async function getAttendanceAndMealReportAction(payload?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AttendanceReportResult> {
  try {
    const db = await getDatabase();

    // Default date range: last 7 days up to today
    const now = new Date();
    const defaultTo = now.toISOString().split("T")[0];
    const past7 = new Date(now);
    past7.setDate(now.getDate() - 6);
    const defaultFrom = past7.toISOString().split("T")[0];

    let fromDate = payload?.fromDate?.trim() || defaultFrom;
    let toDate = payload?.toDate?.trim() || defaultTo;

    if (fromDate > toDate) {
      const temp = fromDate;
      fromDate = toDate;
      toDate = temp;
    }

    // Chronological list of dates (YYYY-MM-DD), bounded to 90 days
    const datesList = expandDateRange(fromDate, toDate);

    // Distinct weekStartDates spanned by the selected range
    const distinctWeekStarts = Array.from(new Set(datesList.map(getWeekStartDate)));

    // Fetch all enrolled students (roster order: room, then name)
    const students = await db
      .collection("users")
      .find({ role: "student" }, { projection: { password: 0 } })
      .sort({ room: 1, name: 1 })
      .toArray();

    const studentIds = students.map((s) => s._id);

    // Weekly lunch selections covering every spanned week
    const selections = await db
      .collection("mealselections")
      .find({
        studentId: { $in: studentIds },
        weekStartDate: { $in: distinctWeekStarts },
      })
      .toArray();

    const selectionsMap = new Map<string, Record<string, boolean>>();
    selections.forEach((sel) => {
      const key = `${sel.studentId.toString()}_${sel.weekStartDate}`;
      selectionsMap.set(key, (sel.lunchSelections as Record<string, boolean>) || {});
    });

    // Attendance records inside the exact date range
    const attendances = await db
      .collection("attendances")
      .find({
        studentId: { $in: studentIds },
        date: { $gte: fromDate, $lte: toDate },
      })
      .toArray();

    const attendanceMap = new Map<string, AttendanceStatus>();
    attendances.forEach((att) => {
      const key = `${att.studentId.toString()}_${att.date}_${att.mealType}`;
      attendanceMap.set(key, att.status as AttendanceStatus);
    });

    const records: ReportItemRecord[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalUnmarked = 0;
    let totalLunchesBooked = 0;
    let totalLunchesAttended = 0;
    let totalLunchesMissed = 0;
    let totalBreakfastsAttended = 0;
    let totalDinnersAttended = 0;

    datesList.forEach((dateStr) => {
      const dayKey = dayKeyOf(dateStr);
      const weekStart = getWeekStartDate(dateStr);

      students.forEach((stu) => {
        const studentIdStr = stu._id.toString();
        const studentWeekLunch =
          selectionsMap.get(`${studentIdStr}_${weekStart}`) || DEFAULT_LUNCH_PREFERENCES;

        MEAL_TYPES.forEach((mealType) => {
          const attStatus =
            attendanceMap.get(`${studentIdStr}_${dateStr}_${mealType}`) || "unmarked";

          // Breakfast & dinner are guaranteed allotments; lunch depends on selection
          const booked = mealType === "lunch" ? Boolean(studentWeekLunch[dayKey]) : true;

          if (attStatus === "present") {
            totalPresent++;
            if (mealType === "lunch") totalLunchesAttended++;
            if (mealType === "breakfast") totalBreakfastsAttended++;
            if (mealType === "dinner") totalDinnersAttended++;
          } else if (attStatus === "absent") {
            totalAbsent++;
            if (mealType === "lunch" && booked) totalLunchesMissed++;
          } else {
            totalUnmarked++;
          }

          if (mealType === "lunch" && booked) {
            totalLunchesBooked++;
          }

          records.push({
            id: `${studentIdStr}_${dateStr}_${mealType}`,
            studentId: studentIdStr,
            studentName: (stu.name as string) || "Unknown",
            room: (stu.room as string) || "N/A",
            email: (stu.email as string) || "",
            isBlocked: Boolean(stu.isBlocked),
            isRedFlagged: Boolean(stu.isRedFlagged),
            penaltyReason: stu.penaltyReason as string | undefined,
            date: dateStr,
            day: dayKey,
            mealType,
            booked,
            attendanceStatus: attStatus,
          });
        });
      });
    });

    const summary: AttendanceReportSummary = {
      fromDate,
      toDate,
      totalStudents: students.length,
      totalRecords: records.length,
      totalPresent,
      totalAbsent,
      totalUnmarked,
      totalLunchesBooked,
      totalLunchesAttended,
      totalLunchesMissed,
      totalBreakfastsAttended,
      totalDinnersAttended,
      flaggedCount: students.filter((s) => s.isRedFlagged).length,
      blockedCount: students.filter((s) => s.isBlocked).length,
    };

    return { success: true, summary, records };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compile attendance report.";
    console.error("getAttendanceAndMealReportAction error:", error);
    return { success: false, message };
  }
}
