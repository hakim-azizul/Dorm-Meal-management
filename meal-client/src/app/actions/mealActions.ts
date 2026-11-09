"use server";

import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentSaturday, getSelectionSaturday } from "./authActions";
import { logAuditEvent } from "@/lib/audit";

export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export interface StudentSelectionResult {
  id: string;
  name: string;
  email: string;
  room?: string;
  isBlocked: boolean;
  penaltyReason?: string;
  isRedFlagged: boolean;
  isPasswordReset: boolean;
}

export interface WeeklySelectionData {
  weekStartDate: string;
  lunchSelections: Record<string, boolean>;
  isLocked: boolean;
}

/**
 * 1. Global Lock Toggle Action
 */
export async function toggleGlobalLockAction(
  isLocked?: boolean
): Promise<{ success: boolean; isGlobalLocked: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });

    const nextLock = typeof isLocked === "boolean" ? isLocked : !config?.isGlobalLocked;

    await db.collection("systemconfigs").updateOne(
      { key: "global_settings" },
      { $set: { key: "global_settings", isGlobalLocked: nextLock, updatedAt: new Date() } },
      { upsert: true }
    );

    // Record audit event
    await logAuditEvent({
      action: "TOGGLE_GLOBAL_LOCK",
      details: { isGlobalLocked: nextLock },
    });

    return {
      success: true,
      isGlobalLocked: nextLock,
      message: `Global selection lock is now ${nextLock ? "ACTIVATED (Locked)" : "DEACTIVATED (Unlocked)"}.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update global lock in database.";
    console.error("toggleGlobalLockAction error:", error);
    return {
      success: false,
      isGlobalLocked: false,
      message,
    };
  }
}

/**
 * 2. Get Global Lock Status Action
 */
export async function getGlobalLockStatusAction(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });
    return Boolean(config?.isGlobalLocked);
  } catch {
    return false;
  }
}

/**
 * 3. Student Lunch Selection Action
 * Controlled directly and exclusively by the Admin Global Lock toggle and student disciplinary state.
 */
export async function selectStudentLunchAction(payload: {
  studentId: string;
  weekStartDate?: string;
  lunchSelections: Record<string, boolean>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { studentId, lunchSelections } = payload;
    if (!studentId) {
      return { success: false, message: "Student ID is required." };
    }

    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);

    // Check user & block status
    const student = await db.collection("users").findOne({ _id: studentObjId });
    if (!student) {
      return { success: false, message: "Student record not found in database." };
    }

    if (student.isBlocked) {
      return {
        success: false,
        message: `Meal selection is suspended: ${(student.penaltyReason as string) || "Disciplinary hold active"}.`,
      };
    }

    // Check global lock
    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });
    if (config?.isGlobalLocked) {
      return {
        success: false,
        message: "ADMIN LOCKED: All meal selections are currently frozen by administration.",
      };
    }

    // Target week defaults to the current active operating week cycle (Saturday through Friday)
    const weekStart = payload.weekStartDate || (await getCurrentSaturday());

    await db.collection("mealselections").updateOne(
      { studentId: studentObjId, weekStartDate: weekStart },
      {
        $set: {
          studentId: studentObjId,
          weekStartDate: weekStart,
          lunchSelections,
          isLocked: false,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return {
      success: true,
      message: "Meal preferences saved successfully.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update lunch selections in database.";
    console.error("selectStudentLunchAction error:", error);
    return {
      success: false,
      message,
    };
  }
}

/**
 * 4. Get Student Selection and Status Action
 */
export async function getStudentSelectionAction(
  studentId: string,
  weekStartDate?: string
): Promise<{
  success: boolean;
  student?: StudentSelectionResult;
  selection?: WeeklySelectionData;
  isGlobalLocked: boolean;
  isFriday: boolean;
  targetWeekStartDate: string;
  message?: string;
}> {
  try {
    const isFriday = new Date().getDay() === 5;
    const defaultWeek = await getCurrentSaturday();
    const weekStart = weekStartDate || defaultWeek;

    if (!studentId) {
      return {
        success: false,
        isGlobalLocked: false,
        isFriday,
        targetWeekStartDate: weekStart,
        message: "Student ID is required.",
      };
    }

    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);
    const student = await db.collection("users").findOne({ _id: studentObjId }, { projection: { password: 0 } });

    if (!student) {
      return {
        success: false,
        isGlobalLocked: false,
        isFriday,
        targetWeekStartDate: weekStart,
        message: "Student not found.",
      };
    }

    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });
    const isGlobalLocked = Boolean(config?.isGlobalLocked);

    const selectionDoc = await db.collection("mealselections").findOne({ studentId: studentObjId, weekStartDate: weekStart });

    const defaultLunchSelections: Record<string, boolean> = {
      sat: true,
      sun: true,
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: false,
    };

    const finalSelection: WeeklySelectionData = {
      weekStartDate: weekStart,
      lunchSelections: (selectionDoc?.lunchSelections as Record<string, boolean>) || defaultLunchSelections,
      isLocked: isGlobalLocked || Boolean(student.isBlocked),
    };

    const studentResult: StudentSelectionResult = {
      id: student._id.toString(),
      name: (student.name as string) || "",
      email: (student.email as string) || "",
      room: student.room as string | undefined,
      isBlocked: Boolean(student.isBlocked),
      penaltyReason: student.penaltyReason as string | undefined,
      isRedFlagged: Boolean(student.isRedFlagged),
      isPasswordReset: student.isPasswordReset ?? false,
    };

    return {
      success: true,
      student: studentResult,
      selection: finalSelection,
      isGlobalLocked,
      isFriday,
      targetWeekStartDate: weekStart,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve student meal selection.";
    console.error("getStudentSelectionAction error:", error);
    return {
      success: false,
      isGlobalLocked: false,
      isFriday: new Date().getDay() === 5,
      targetWeekStartDate: "",
      message,
    };
  }
}

/**
 * 5. Admin Block / Penalty Toggle Action
 */
export async function toggleStudentBlockAction(payload: {
  studentId: string;
  isBlocked: boolean;
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { studentId, isBlocked, reason } = payload;
    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);

    await db.collection("users").updateOne(
      { _id: studentObjId },
      {
        $set: {
          isBlocked,
          penaltyReason: isBlocked ? reason || "Disciplinary meal policy violation" : "",
          updatedAt: new Date(),
        },
      }
    );

    // Record audit event
    await logAuditEvent({
      action: isBlocked ? "BLOCK_STUDENT" : "UNBLOCK_STUDENT",
      targetId: studentId,
      details: { isBlocked, reason: reason || "" },
    });

    return {
      success: true,
      message: `Student meal privileges ${isBlocked ? "BLOCKED" : "UNBLOCKED"} successfully.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update student penalty status.";
    return { success: false, message };
  }
}

/**
 * 6. Admin Override Student Lunch Action
 */
export async function adminOverrideLunchAction(payload: {
  studentId: string;
  day: DayKey;
  selected?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { studentId, day } = payload;
    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);
    const weekStart = await getCurrentSaturday();

    const record = await db.collection("mealselections").findOne({ studentId: studentObjId, weekStartDate: weekStart });
    const currentVal = Boolean(record?.lunchSelections?.[day] ?? true);
    const newVal = typeof payload.selected === "boolean" ? payload.selected : !currentVal;

    await db.collection("mealselections").updateOne(
      { studentId: studentObjId, weekStartDate: weekStart },
      {
        $set: {
          [`lunchSelections.${day}`]: newVal,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Record audit event
    await logAuditEvent({
      action: "OVERRIDE_LUNCH",
      targetId: studentId,
      details: { day, selected: newVal, weekStartDate: weekStart },
    });

    return {
      success: true,
      message: `Lunch override applied for ${day.toUpperCase()}: ${newVal ? "Selected" : "Opted-out"}.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to override student meal.";
    return { success: false, message };
  }
}

/**
 * 7. Chef Check-In & Red-Flag Action
 */
export async function checkInStudentAction(payload: {
  studentId: string;
  mealType: "breakfast" | "lunch" | "dinner";
  status: "present" | "absent";
  date?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { studentId, mealType, status } = payload;
    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);
    const todayDate = payload.date || new Date().toISOString().split("T")[0];

    await db.collection("attendances").updateOne(
      { studentId: studentObjId, date: todayDate, mealType },
      {
        $set: {
          studentId: studentObjId,
          date: todayDate,
          mealType,
          status,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Red-Flag Business Rules:
    // Lunch + Absent -> isRedFlagged = true
    // Any meal + Present -> clear isRedFlagged = false
    if (mealType === "lunch" && status === "absent") {
      await db.collection("users").updateOne({ _id: studentObjId }, { $set: { isRedFlagged: true } });
    } else if (status === "present") {
      await db.collection("users").updateOne({ _id: studentObjId }, { $set: { isRedFlagged: false } });
    }

    return {
      success: true,
      message: `Attendance recorded as ${status.toUpperCase()} for ${mealType}.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update attendance.";
    return { success: false, message };
  }
}

/**
 * 8. Comprehensive Date-Range Attendance & Meal Report Action
 */
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
  mealType: "breakfast" | "lunch" | "dinner";
  booked: boolean;
  attendanceStatus: "present" | "absent" | "unmarked";
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

export async function getAttendanceAndMealReportAction(payload?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AttendanceReportResult> {
  try {
    const db = await getDatabase();

    // Default date range: Last 7 days up to today
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

    // Generate chronological list of date strings (YYYY-MM-DD)
    const datesList: string[] = [];
    const current = new Date(`${fromDate}T00:00:00Z`);
    const end = new Date(`${toDate}T00:00:00Z`);

    // Guard maximum range to 90 days to maintain performance
    let loopGuard = 0;
    while (current <= end && loopGuard < 90) {
      datesList.push(current.toISOString().split("T")[0]);
      current.setUTCDate(current.getUTCDate() + 1);
      loopGuard++;
    }

    // Helper: Map JS day to DayKey
    const dayKeyMap: Record<number, DayKey> = {
      0: "sun",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat",
    };

    // Helper: Get Saturday weekStartDate for any given date string
    const getWeekStart = (dateStr: string): string => {
      const d = new Date(`${dateStr}T00:00:00Z`);
      const day = d.getUTCDay();
      const diffToSat = day === 6 ? 0 : -(day + 1);
      const sat = new Date(d);
      sat.setUTCDate(d.getUTCDate() + diffToSat);
      return sat.toISOString().split("T")[0];
    };

    // Distinct weekStartDates spanned by the selected range
    const distinctWeekStarts = Array.from(new Set(datesList.map(getWeekStart)));

    // Fetch all enrolled students
    const students = await db
      .collection("users")
      .find({ role: "student" }, { projection: { password: 0 } })
      .sort({ room: 1, name: 1 })
      .toArray();

    const studentIds = students.map((s) => s._id);

    // Fetch meal selections covering all spanned weeks
    const selections = await db
      .collection("mealselections")
      .find({
        studentId: { $in: studentIds },
        weekStartDate: { $in: distinctWeekStarts },
      })
      .toArray();

    // Map selections by `studentId_weekStartDate`
    const selectionsMap = new Map<string, Record<string, boolean>>();
    selections.forEach((sel) => {
      const key = `${sel.studentId.toString()}_${sel.weekStartDate}`;
      selectionsMap.set(key, (sel.lunchSelections as Record<string, boolean>) || {});
    });

    // Fetch all attendance records in the exact date range
    const attendances = await db
      .collection("attendances")
      .find({
        studentId: { $in: studentIds },
        date: { $gte: fromDate, $lte: toDate },
      })
      .toArray();

    // Map attendances by `studentId_date_mealType`
    const attendanceMap = new Map<string, "present" | "absent">();
    attendances.forEach((att) => {
      const key = `${att.studentId.toString()}_${att.date}_${att.mealType}`;
      attendanceMap.set(key, att.status as "present" | "absent");
    });

    // Default lunch preference fallback
    const defaultLunchPref: Record<string, boolean> = {
      sat: true,
      sun: true,
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: false,
    };

    const mealTypes: Array<"breakfast" | "lunch" | "dinner"> = [
      "breakfast",
      "lunch",
      "dinner",
    ];

    const records: ReportItemRecord[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalUnmarked = 0;
    let totalLunchesBooked = 0;
    let totalLunchesAttended = 0;
    let totalLunchesMissed = 0;
    let totalBreakfastsAttended = 0;
    let totalDinnersAttended = 0;

    // Build granular report items
    datesList.forEach((dateStr) => {
      const dateObj = new Date(`${dateStr}T00:00:00Z`);
      const dayKey = dayKeyMap[dateObj.getUTCDay()] || "mon";
      const weekStart = getWeekStart(dateStr);

      students.forEach((stu) => {
        const studentIdStr = stu._id.toString();
        const selKey = `${studentIdStr}_${weekStart}`;
        const studentWeekLunch = selectionsMap.get(selKey) || defaultLunchPref;

        mealTypes.forEach((mealType) => {
          const attKey = `${studentIdStr}_${dateStr}_${mealType}`;
          const attStatus = attendanceMap.get(attKey) || "unmarked";

          // Breakfast & Dinner are guaranteed allotments; Lunch depends on selection
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

    const flaggedCount = students.filter((s) => s.isRedFlagged).length;
    const blockedCount = students.filter((s) => s.isBlocked).length;

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
      flaggedCount,
      blockedCount,
    };

    return {
      success: true,
      summary,
      records,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compile attendance report.";
    console.error("getAttendanceAndMealReportAction error:", error);
    return {
      success: false,
      message,
    };
  }
}
