"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import type { StudentRecord } from "@/context/MealAppContext";
import { SearchInput } from "@/components/ui/SearchInput";

export interface SidebarStudentQuickListProps {
  students: StudentRecord[];
  selectedStudentId?: string;
  onSelectStudent?: (student: StudentRecord) => void;
}

/** Compact searchable student list embedded in the warden sidebar for quick focus. */
export function SidebarStudentQuickList({
  students,
  selectedStudentId,
  onSelectStudent,
}: SidebarStudentQuickListProps) {
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.room.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="pt-3 border-t border-base-300/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-base-content/70 uppercase tracking-wider flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> Students ({students.length})
        </span>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        size="xs"
        placeholder="Quick find..."
        label="Quick find student"
        inputClassName="bg-base-100 rounded-lg"
      />

      <div className="max-h-40 overflow-y-auto space-y-1 pe-1">
        {filtered.slice(0, 15).map((student) => {
          const isSelected = selectedStudentId === student.id;
          return (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelectStudent?.(student)}
              className={`w-full text-start p-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                isSelected
                  ? "bg-emerald-600 text-white font-bold"
                  : "hover:bg-base-300/60 text-base-content"
              }`}
            >
              <span className="truncate max-w-36">{student.name}</span>
              <span className="flex items-center gap-1">
                {student.isBlocked ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Blocked" />
                ) : student.isRedFlagged ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Red Flag" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                )}
                <span className="text-[10px] opacity-70">{student.room}</span>
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-[11px] text-base-content/50 text-center py-2">
            No students found
          </div>
        )}
      </div>
    </div>
  );
}
