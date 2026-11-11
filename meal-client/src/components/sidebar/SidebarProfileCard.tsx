"use client";

import React from "react";
import { AlertTriangle, KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { useMealApp, type StudentRecord } from "@/context/MealAppContext";
import { SidebarStudentQuickList } from "./SidebarStudentQuickList";

export interface SidebarRoleMeta {
  title: string;
  icon: React.ReactNode;
  badgeClass: string;
  bgClass: string;
}

export interface SidebarProfileCardProps {
  meta: SidebarRoleMeta;
  onSelectStudent?: (student: StudentRecord) => void;
  selectedStudentId?: string;
  onOpenPasswordModal: () => void;
  onSignOut: () => void;
}

/** Section 1 of the sidebar: identity, role/disciplinary badges, account actions and (for wardens) the quick student list. */
export function SidebarProfileCard({
  meta,
  onSelectStudent,
  selectedStudentId,
  onOpenPasswordModal,
  onSignOut,
}: SidebarProfileCardProps) {
  const { currentUser, currentRole, students } = useMealApp();

  return (
    <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${meta.bgClass}`}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-base-content truncate">
              {currentUser?.name || "User"}
            </h2>
            <p className="text-[11px] text-base-content/60 truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* Role & disciplinary badges */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-base-300/60">
        <span className={`badge badge-sm font-extrabold ${meta.badgeClass}`}>{meta.title}</span>

        {currentUser?.room && (
          <span className="badge badge-ghost badge-sm text-[11px] font-semibold">
            {currentUser.room}
          </span>
        )}

        {currentUser?.shift && (
          <span className="badge badge-ghost badge-sm text-[10px] font-semibold truncate max-w-36">
            {currentUser.shift}
          </span>
        )}

        {currentUser?.isBlocked && (
          <span className="badge badge-error badge-sm text-white text-[10px] font-bold gap-1">
            <ShieldAlert className="w-2.5 h-2.5" /> Suspended
          </span>
        )}

        {currentUser?.isRedFlagged && (
          <span className="badge badge-error badge-sm text-white text-[10px] font-bold gap-1 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" /> Flagged
          </span>
        )}

        {currentUser?.isPasswordReset && (
          <span className="badge badge-warning badge-sm text-[10px] font-bold">
            Default Pass
          </span>
        )}
      </div>

      {/* Account actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={onOpenPasswordModal}
          className="btn btn-xs btn-outline btn-primary rounded-xl font-bold flex items-center justify-center gap-1.5 py-2 h-auto text-[11px]"
          title="Change account password"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="btn btn-xs btn-outline btn-error rounded-xl font-bold flex items-center justify-center gap-1.5 py-2 h-auto text-[11px]"
          title="Sign out of session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Warden quick student list */}
      {currentRole === "admin" && (
        <SidebarStudentQuickList
          students={students}
          selectedStudentId={selectedStudentId}
          onSelectStudent={onSelectStudent}
        />
      )}
    </div>
  );
}
