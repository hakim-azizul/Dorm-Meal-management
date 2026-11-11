"use client";

import React from "react";
import { AlertTriangle, KeyRound, ShieldAlert, Trash2 } from "lucide-react";
import { DAYS, type DayKey } from "@/lib/days";
import type { StudentRecord } from "@/context/MealAppContext";
import type { PasswordResetRequest } from "./types";

export interface StudentRowProps {
  student: StudentRecord;
  isSelected: boolean;
  onOverrideLunch: (studentId: string, day: DayKey) => void;
  onOpenBlock: (student: StudentRecord) => void;
  onLiftBlock: (student: StudentRecord) => void;
  onRequestReset: (user: PasswordResetRequest) => void;
  onDelete: (student: StudentRecord) => void;
}

/** Single roster card: identity, disciplinary badges, per-day lunch override pills and actions. */
export function StudentRow({
  student,
  isSelected,
  onOverrideLunch,
  onOpenBlock,
  onLiftBlock,
  onRequestReset,
  onDelete,
}: StudentRowProps) {
  return (
    <div
      id={`student-${student.id}`}
      className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all ${
        isSelected
          ? "border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs"
          : "border-base-300 hover:border-base-400"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Identity & disciplinary state */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-sm flex items-center justify-center shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-base-content truncate">{student.name}</span>
              <span className="badge badge-sm badge-ghost text-[10px] font-semibold">
                {student.room}
              </span>

              {student.isBlocked ? (
                <span className="badge badge-sm badge-error text-white font-bold gap-1 text-[10px]">
                  <ShieldAlert className="w-2.5 h-2.5" /> Suspended
                </span>
              ) : student.isRedFlagged ? (
                <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold gap-1 text-[10px]">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Red
                  Flag
                </span>
              ) : (
                <span className="badge badge-sm badge-success text-success-content font-bold text-[10px]">
                  Active
                </span>
              )}

              {student.isPasswordReset && (
                <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                  Default Pass
                </span>
              )}
            </div>
            <p className="text-[11px] text-base-content/60 truncate mt-0.5">
              {student.email}
              {student.penaltyReason && ` • ${student.penaltyReason}`}
            </p>
          </div>
        </div>

        {/* Day-by-day meal override pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 lg:py-0">
          <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider me-1">
            Override:
          </span>
          {DAYS.map((day) => {
            const isSelectedDay = student.schedule[day]?.lunchSelected;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onOverrideLunch(student.id, day)}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                  isSelectedDay
                    ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                    : "bg-base-200 text-base-content/40 hover:bg-base-300"
                }`}
                title={`Click to toggle lunch for ${day.toUpperCase()}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Row actions */}
        <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
          {student.isBlocked ? (
            <button
              type="button"
              onClick={() => onLiftBlock(student)}
              className="btn btn-xs btn-outline btn-success font-bold rounded-lg text-[10px]"
            >
              Lift Block
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenBlock(student)}
              className="btn btn-xs btn-outline btn-error font-bold rounded-lg text-[10px]"
            >
              Block
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onRequestReset({ id: student.id, name: student.name, role: "Student" })
            }
            className="btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-base-content"
            title="Reset Password to Dorm@1234"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(student)}
            className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error"
            title="Delete Student"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
