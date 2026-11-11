import type { getStudentSelectionAction } from "@/app/actions/mealActions";
import type { UserListItem } from "@/app/actions/authActions";
import { DAYS } from "@/lib/days";
import type { ChefRecord, StudentRecord } from "./types";

type StudentSelectionResponse = Awaited<ReturnType<typeof getStudentSelectionAction>>;
type StudentSchedule = StudentRecord["schedule"];

const buildDaySlot = (lunchSelected: boolean) => ({
  lunchSelected,
  lunchCheckedIn: false,
  lunchMissed: false,
});

const buildAttendanceToday = (): StudentRecord["attendanceToday"] => ({
  breakfast: false,
  lunch: "unmarked",
  dinner: false,
});

/** Default operating-week schedule: lunches selected Sat–Thu, opted out on Friday. */
export function buildDefaultSchedule(): StudentSchedule {
  return {
    sat: buildDaySlot(true),
    sun: buildDaySlot(true),
    mon: buildDaySlot(true),
    tue: buildDaySlot(true),
    wed: buildDaySlot(true),
    thu: buildDaySlot(true),
    fri: buildDaySlot(false),
  };
}

/** Builds a schedule from a persisted `lunchSelections` map. */
export function buildScheduleFromSelections(
  selections: Record<string, boolean>,
): StudentSchedule {
  const schedule = {} as StudentSchedule;
  for (const day of DAYS) {
    schedule[day] = buildDaySlot(Boolean(selections[day]));
  }
  return schedule;
}

/** Maps a raw `users` document into the dashboard StudentRecord contract. */
export function mapUserToStudent(user: UserListItem): StudentRecord {
  return {
    id: user._id || user.id || "",
    name: user.name,
    room: user.room || "Room Unassigned",
    email: user.email,
    isBlocked: Boolean(user.isBlocked),
    penaltyReason: user.penaltyReason,
    isRedFlagged: Boolean(user.isRedFlagged),
    isPasswordReset: user.isPasswordReset ?? false,
    schedule: buildDefaultSchedule(),
    attendanceToday: buildAttendanceToday(),
  };
}

/** Maps a raw `users` document into the dashboard ChefRecord contract. */
export function mapUserToChef(user: UserListItem): ChefRecord {
  return {
    id: user._id || user.id || "",
    name: user.name,
    email: user.email,
    shift: user.shift || "Morning & Lunch Session",
    isPasswordReset: user.isPasswordReset ?? false,
  };
}

/** Creates a StudentRecord from a freshly fetched selection response. */
export function buildStudentFromSelection(res: StudentSelectionResponse): StudentRecord {
  const selections = res.selection?.lunchSelections || {};
  return {
    id: res.student?.id || "",
    name: res.student?.name || "",
    room: res.student?.room || "Room Unassigned",
    email: res.student?.email || "",
    isBlocked: Boolean(res.student?.isBlocked),
    penaltyReason: res.student?.penaltyReason,
    isRedFlagged: Boolean(res.student?.isRedFlagged),
    isPasswordReset: res.student?.isPasswordReset ?? false,
    schedule: buildScheduleFromSelections(selections),
    attendanceToday: buildAttendanceToday(),
  };
}

/** Merges a fresh selection response into an existing StudentRecord. */
export function mergeStudentSelection(
  existing: StudentRecord,
  res: StudentSelectionResponse,
): StudentRecord {
  const selections = res.selection?.lunchSelections || {};
  const updatedSchedule: StudentSchedule = { ...existing.schedule };

  for (const day of DAYS) {
    if (typeof selections[day] === "boolean") {
      updatedSchedule[day] = { ...updatedSchedule[day], lunchSelected: selections[day] };
    }
  }

  return {
    ...existing,
    name: res.student?.name || existing.name,
    isBlocked: Boolean(res.student?.isBlocked),
    isRedFlagged: Boolean(res.student?.isRedFlagged),
    penaltyReason: res.student?.penaltyReason,
    isPasswordReset: res.student?.isPasswordReset ?? existing.isPasswordReset,
    schedule: updatedSchedule,
  };
}
