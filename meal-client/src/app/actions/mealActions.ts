"use server";

import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentSaturday } from "./authActions";
import { logAuditEvent } from "@/lib/audit";

export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

/**
 * 1. Global Lock Toggle Action
 */
export async function toggleGlobalLockAction(
  isLocked?: boolean
): Promise<{ success: boolean; isGlobalLocked: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });

    let nextLock = typeof isLocked === "boolean" ? isLocked : !config?.isGlobalLocked;

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
  } catch (error: any) {
    console.error("toggleGlobalLockAction error:", error);
    return {
      success: false,
      isGlobalLocked: false,
      message: error.message || "Failed to update global lock in database.",
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
    return !!config?.isGlobalLocked;
  } catch {
    return false;
  }
}

/**
 * 3. Student Lunch Selection Action
 */
export async function selectStudentLunchAction(payload: {
  studentId: string;
  weekStartDate?: string;
  lunchSelections: Record<string, boolean>;
  simulateFriday?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { studentId, lunchSelections, simulateFriday } = payload;
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
        message: `Meal selection is suspended: ${student.penaltyReason || "Disciplinary hold active"}.`,
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

    // Validate Friday restriction (unless simulated or development)
    const todayDay = new Date().getDay(); // 5 = Friday
    const isFridayToday = todayDay === 5;
    if (!isFridayToday && !simulateFriday) {
      return {
        success: false,
        message: "Lunch selection can only be modified on FRIDAYS.",
      };
    }

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
      message: "Weekly lunch preferences saved successfully in database.",
    };
  } catch (error: any) {
    console.error("selectStudentLunchAction error:", error);
    return {
      success: false,
      message: error.message || "Failed to update lunch selections in database.",
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
  student?: any;
  selection?: any;
  isGlobalLocked: boolean;
  message?: string;
}> {
  try {
    if (!studentId) {
      return { success: false, isGlobalLocked: false, message: "Student ID is required." };
    }

    const db = await getDatabase();
    const studentObjId = new ObjectId(studentId);
    const student = await db.collection("users").findOne({ _id: studentObjId }, { projection: { password: 0 } });

    if (!student) {
      return { success: false, isGlobalLocked: false, message: "Student not found." };
    }

    const config = await db.collection("systemconfigs").findOne({ key: "global_settings" });
    const isGlobalLocked = !!config?.isGlobalLocked;

    const weekStart = weekStartDate || (await getCurrentSaturday());
    const selectionDoc = await db.collection("mealselections").findOne({ studentId: studentObjId, weekStartDate: weekStart });

    const finalSelection = selectionDoc || {
      weekStartDate: weekStart,
      lunchSelections: { sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false },
      isLocked: isGlobalLocked || student.isBlocked,
    };

    return {
      success: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        room: student.room,
        isBlocked: !!student.isBlocked,
        penaltyReason: student.penaltyReason,
        isRedFlagged: !!student.isRedFlagged,
        isPasswordReset: student.isPasswordReset ?? false,
      },
      selection: {
        weekStartDate: finalSelection.weekStartDate,
        lunchSelections: finalSelection.lunchSelections,
        isLocked: !!finalSelection.isLocked,
      },
      isGlobalLocked,
    };
  } catch (error: any) {
    console.error("getStudentSelectionAction error:", error);
    return {
      success: false,
      isGlobalLocked: false,
      message: error.message || "Failed to retrieve student meal selection.",
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
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update student penalty status." };
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
    const currentVal = record?.lunchSelections?.[day] ?? true;
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
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to override student meal." };
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
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update attendance." };
  }
}
