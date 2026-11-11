"use client";

import React from "react";
import { AlertTriangle, UserCheck, UserX } from "lucide-react";
import type { MealType, StudentRecord } from "@/context/MealAppContext";

export interface ChefStudentRowProps {
  student: StudentRecord;
  activeSession: MealType;
  onBreakfastCheckIn: (studentId: string) => void;
  onDinnerCheckIn: (studentId: string) => void;
  onLunchStatus: (studentId: string, status: "present" | "absent") => void;
}

/** Single attendance card with the check-in controls bound to the active meal session. */
export function ChefStudentRow({
  student,
  activeSession,
  onBreakfastCheckIn,
  onDinnerCheckIn,
  onLunchStatus,
}: ChefStudentRowProps) {
  const lunchAttendance = student.attendanceToday?.lunch;
  const breakfastChecked = student.attendanceToday?.breakfast;
  const dinnerChecked = student.attendanceToday?.dinner;

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all ${
        student.isRedFlagged
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-base-300 hover:border-base-400"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Identity & flags */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent font-black text-xs flex items-center justify-center shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-base-content truncate">
                {student.name}
              </span>
              <span className="badge badge-sm badge-ghost text-[10px] font-semibold">
                {student.room}
              </span>
              {student.isRedFlagged && (
                <span className="badge badge-sm badge-warning font-black text-[9px] gap-1 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" /> Red-Flag
                </span>
              )}
            </div>
            <p className="text-[11px] text-base-content/50 truncate">{student.email}</p>
          </div>
        </div>

        {/* Session check-in controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {activeSession === "breakfast" && (
            <button
              type="button"
              onClick={() => onBreakfastCheckIn(student.id)}
              className={`btn btn-sm rounded-xl font-bold text-xs gap-1.5 ${
                breakfastChecked
                  ? "btn-success text-success-content"
                  : "btn-outline btn-success"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{breakfastChecked ? "Attended" : "Check In"}</span>
            </button>
          )}

          {activeSession === "lunch" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onLunchStatus(student.id, "present")}
                className={`btn btn-sm rounded-xl font-bold text-xs gap-1 ${
                  lunchAttendance === "present"
                    ? "btn-success text-success-content shadow-xs"
                    : "btn-outline btn-success"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Present</span>
              </button>

              <button
                type="button"
                onClick={() => onLunchStatus(student.id, "absent")}
                className={`btn btn-sm rounded-xl font-bold text-xs gap-1 ${
                  lunchAttendance === "absent"
                    ? "btn-error text-white shadow-xs"
                    : "btn-outline btn-error"
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Absent</span>
              </button>
            </div>
          )}

          {activeSession === "dinner" && (
            <button
              type="button"
              onClick={() => onDinnerCheckIn(student.id)}
              className={`btn btn-sm rounded-xl font-bold text-xs gap-1.5 ${
                dinnerChecked ? "btn-success text-success-content" : "btn-outline btn-success"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{dinnerChecked ? "Attended" : "Check In"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
