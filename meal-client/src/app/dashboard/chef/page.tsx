"use client";

import React, { useState } from "react";
import { useMealApp } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  ChefHat,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

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

  const [activeSession, setActiveSession] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // STRICT REQUIREMENT FOR LUNCH TAB:
  // "Lunch Tab: STRICTLY shows ONLY students who pre-selected lunch for today."
  const displayedStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.room.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeSession === "lunch") {
      // Must have pre-selected lunch for today!
      return Boolean(student.schedule[systemDay]?.lunchSelected);
    }

    // Breakfast and Dinner: All active registered residents
    return true;
  });

  // Calculate live session counters
  const totalEligibleCount = displayedStudents.length;

  const handleLunchStatus = async (studentId: string, status: "present" | "absent") => {
    try {
      const res = await markChefLunchStatus(studentId, status);
      if (res.success) {
        setNotification({ type: "success", text: res.message });
      } else {
        setNotification({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to record attendance";
      setNotification({ type: "error", text: errorMsg });
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleBreakfastCheckIn = async (studentId: string) => {
    await markChefBreakfast(studentId);
    setNotification({ type: "success", text: "Breakfast attendance confirmed." });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleDinnerCheckIn = async (studentId: string) => {
    await markChefDinner(studentId);
    setNotification({ type: "success", text: "Dinner attendance confirmed." });
    setTimeout(() => setNotification(null), 2500);
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
      {/* 1. Responsive Sidebar with User Profile & Meal Session Tabs */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        chefSession={activeSession}
        onChefSessionChange={setActiveSession}
      />

      {/* 2. Main Chef Area */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-4">
        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Operating Date & Session Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-base-content capitalize">
                  {activeSession} Session
                </span>
                <span className="badge badge-accent badge-xs font-black uppercase text-[9px] px-2 py-1">
                  Today Only
                </span>
              </div>
              <p className="text-[11px] text-base-content/60 mt-0.5">
                {todayDateFormatted}
              </p>
            </div>
          </div>

          {/* Session Switcher Pills */}
          <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveSession("breakfast")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSession === "breakfast"
                  ? "bg-accent text-accent-content shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              Breakfast
            </button>
            <button
              onClick={() => setActiveSession("lunch")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSession === "lunch"
                  ? "bg-accent text-accent-content shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              Lunch (Pre-Selected)
            </button>
            <button
              onClick={() => setActiveSession("dinner")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSession === "dinner"
                  ? "bg-accent text-accent-content shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              Dinner
            </button>
          </div>
        </div>

        {/* Notice for Lunch Gating */}
        {activeSession === "lunch" && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Strict Pre-Selection: Only students who booked lunch for today appear on this list.</span>
          </div>
        )}

        {/* Search Bar & Eligible Counter */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSession} attendees by name or room...`}
              className="input input-sm w-full bg-base-100 rounded-xl border-base-300 ps-9 pe-8 text-xs font-medium"
            />
            <Search className="w-4 h-4 text-base-content/40 absolute start-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-2.5 top-2.5 text-base-content/40 hover:text-base-content"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="badge badge-sm badge-ghost font-bold text-xs shrink-0">
            {totalEligibleCount} Expected
          </span>
        </div>

        {/* Student Attendance List */}
        <div className="space-y-2">
          {displayedStudents.map((student) => {
            const lunchAttendance = student.attendanceToday?.lunch;
            const breakfastChecked = student.attendanceToday?.breakfast;
            const dinnerChecked = student.attendanceToday?.dinner;

            return (
              <div
                key={student.id}
                className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all ${
                  student.isRedFlagged
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-base-300 hover:border-base-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Student Info */}
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
                      <p className="text-[11px] text-base-content/50 truncate">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Controls */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* BREAKFAST Check-in */}
                    {activeSession === "breakfast" && (
                      <button
                        onClick={() => handleBreakfastCheckIn(student.id)}
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

                    {/* LUNCH Check-in & Absence */}
                    {activeSession === "lunch" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLunchStatus(student.id, "present")}
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
                          onClick={() => handleLunchStatus(student.id, "absent")}
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

                    {/* DINNER Check-in */}
                    {activeSession === "dinner" && (
                      <button
                        onClick={() => handleDinnerCheckIn(student.id)}
                        className={`btn btn-sm rounded-xl font-bold text-xs gap-1.5 ${
                          dinnerChecked
                            ? "btn-success text-success-content"
                            : "btn-outline btn-success"
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
          })}

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
