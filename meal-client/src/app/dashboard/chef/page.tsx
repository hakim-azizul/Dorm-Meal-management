"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useMealApp, type MealType } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { SearchInput } from "@/components/ui/SearchInput";
import { useNotification } from "@/hooks/useNotification";
import { ChefSessionBar } from "@/components/chef/ChefSessionBar";
import { ChefStudentRow } from "@/components/chef/ChefStudentRow";

/**
 * Mess portal: strictly today's operating date, split into Breakfast,
 * Lunch (pre-selection gated) and Dinner attendance sessions.
 */
export default function ChefDashboard() {
  const {
    students,
    systemDay,
    todayDateFormatted,
    markChefBreakfast,
    markChefDinner,
    markChefLunchStatus,
    isHydrated,
    isSidebarOpen,
    closeSidebar,
  } = useMealApp();

  const { notification, notify, clearNotification } = useNotification();

  const [activeSession, setActiveSession] = useState<MealType>("lunch");
  const [searchQuery, setSearchQuery] = useState("");

  // Lunch is strictly gated to students who pre-selected lunch for today.
  const displayedStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.room.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (activeSession === "lunch") {
        return Boolean(student.schedule[systemDay]?.lunchSelected);
      }
      return true;
    });
  }, [students, searchQuery, activeSession, systemDay]);

  const handleLunchStatus = async (studentId: string, status: "present" | "absent") => {
    try {
      const res = await markChefLunchStatus(studentId, status);
      notify({ type: res.success ? "success" : "error", text: res.message });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to record attendance";
      notify({ type: "error", text: errorMsg });
    }
  };

  const handleBreakfastCheckIn = async (studentId: string) => {
    await markChefBreakfast(studentId);
    notify({ type: "success", text: "Breakfast attendance confirmed." }, 2500);
  };

  const handleDinnerCheckIn = async (studentId: string) => {
    await markChefDinner(studentId);
    notify({ type: "success", text: "Dinner attendance confirmed." }, 2500);
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-md text-accent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-base-100">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        chefSession={activeSession}
        onChefSessionChange={setActiveSession}
      />

      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-4">
        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={clearNotification}
          />
        )}

        <ChefSessionBar
          activeSession={activeSession}
          onSessionChange={setActiveSession}
          todayDateFormatted={todayDateFormatted}
        />

        {/* Pre-selection gating notice */}
        {activeSession === "lunch" && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Only students who booked lunch for today appear on this list.</span>
          </div>
        )}

        {/* Search & eligible counter */}
        <div className="flex items-center justify-between gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeSession} attendees by name or room...`}
            label="Search attendees"
            className="flex-1"
          />

          <span className="badge badge-sm badge-ghost font-bold text-xs shrink-0">
            {displayedStudents.length} Expected
          </span>
        </div>

        {/* Attendance roster */}
        <div className="space-y-2">
          {displayedStudents.map((student) => (
            <ChefStudentRow
              key={student.id}
              student={student}
              activeSession={activeSession}
              onBreakfastCheckIn={handleBreakfastCheckIn}
              onDinnerCheckIn={handleDinnerCheckIn}
              onLunchStatus={handleLunchStatus}
            />
          ))}

          {displayedStudents.length === 0 && (
            <div className="p-8 rounded-2xl bg-base-100 border border-base-300 text-center text-xs text-base-content/60">
              {activeSession === "lunch"
                ? "No students pre-selected lunch for today."
                : "No students found matching your search."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
