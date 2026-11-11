"use client";

import React, { useMemo } from "react";
import type { DayKey } from "@/lib/days";
import type { StudentRecord } from "@/context/MealAppContext";
import { SearchInput } from "@/components/ui/SearchInput";
import { StudentRow } from "./StudentRow";
import type { PasswordResetRequest, StudentStatusFilter } from "./types";

export interface StudentsTabProps {
  students: StudentRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StudentStatusFilter;
  onStatusFilterChange: (filter: StudentStatusFilter) => void;
  selectedStudentId?: string;
  onOverrideLunch: (studentId: string, day: DayKey) => void;
  onOpenBlock: (student: StudentRecord) => void;
  onLiftBlock: (student: StudentRecord) => void;
  onRequestReset: (user: PasswordResetRequest) => void;
  onDelete: (student: StudentRecord) => void;
}

const STATUS_FILTERS: readonly StudentStatusFilter[] = [
  "all",
  "active",
  "penalized",
  "redflags",
];

const STATUS_FILTER_LABELS: Record<StudentStatusFilter, string> = {
  all: "All",
  active: "Active",
  penalized: "Penalized",
  redflags: "Flagged",
};

/** Student roster tab: search, disciplinary filters and the responsive card list. */
export function StudentsTab({
  students,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedStudentId,
  onOverrideLunch,
  onOpenBlock,
  onLiftBlock,
  onRequestReset,
  onDelete,
}: StudentsTabProps) {
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.room.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (statusFilter === "penalized") return student.isBlocked;
      if (statusFilter === "redflags") return student.isRedFlagged;
      if (statusFilter === "active") return !student.isBlocked && !student.isRedFlagged;
      return true;
    });
  }, [students, searchTerm, statusFilter]);

  return (
    <div className="space-y-3">
      {/* Search & disciplinary filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by student name, room, or email..."
          label="Search students"
          className="flex-1"
        />

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={`btn btn-xs rounded-lg font-bold ${
                statusFilter === filter
                  ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 border-none"
                  : "btn-ghost bg-base-200/60 text-base-content/70"
              }`}
            >
              {STATUS_FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>

      {/* Roster list */}
      <div className="space-y-2">
        {filteredStudents.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            isSelected={selectedStudentId === student.id}
            onOverrideLunch={onOverrideLunch}
            onOpenBlock={onOpenBlock}
            onLiftBlock={onLiftBlock}
            onRequestReset={onRequestReset}
            onDelete={onDelete}
          />
        ))}

        {filteredStudents.length === 0 && (
          <div className="p-8 rounded-2xl bg-base-100 border border-base-300 text-center text-xs text-base-content/60">
            No students matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
