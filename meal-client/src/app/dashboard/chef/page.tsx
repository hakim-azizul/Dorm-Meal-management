"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp } from "@/context/MealAppContext";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { StatCard } from "@/components/ui/StatCard";
import { DatabaseStatusBadge } from "@/components/ui/DatabaseStatusBadge";
import {
  ChefHat,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  Search,
  UserCheck,
  UserX,
  Sparkles,
  Users,
} from "lucide-react";

export default function ChefDashboard() {
  const { t } = useLanguage();
  const {
    students,
    systemDay,
    todayDateFormatted,
    markChefBreakfast,
    markChefDinner,
    markChefLunchStatus,
    isHydrated,
  } = useMealApp();

  const [activeSession, setActiveSession] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // STRICT REQUIREMENT FOR LUNCH TAB:
  // "Lunch Tab: STRICTLY shows ONLY students who pre-selected lunch for today. Students without a pre-selected lunch MUST NOT appear here."
  const displayedStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.room.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeSession === "lunch") {
      // STRICT FILTER: Student MUST have pre-selected lunch for today!
      return Boolean(student.schedule[systemDay]?.lunchSelected);
    }

    // Breakfast and Dinner: Fixed / Included for all registered hostel residents
    return true;
  });

  // Calculate live counters
  const expectedLunchCount = students.filter((s) => s.schedule[systemDay]?.lunchSelected).length;
  const presentLunchCount = students.filter(
    (s) => s.schedule[systemDay]?.lunchSelected && s.attendanceToday.lunch === "present"
  ).length;
  const absentLunchCount = students.filter(
    (s) => s.schedule[systemDay]?.lunchSelected && s.attendanceToday.lunch === "absent"
  ).length;
  const activeRedFlagCount = displayedStudents.filter((s) => s.isRedFlagged).length;

  const handleLunchStatus = async (studentId: string, status: "present" | "absent") => {
    try {
      const res = await markChefLunchStatus(studentId, status);
      if (res.success) {
        setNotification({ type: "success", text: res.message });
      } else {
        setNotification({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update attendance.";
      setNotification({ type: "error", text: errorMsg });
    } finally {
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const handleBreakfastCheckIn = async (studentId: string) => {
    await markChefBreakfast(studentId);
    setNotification({ type: "success", text: "Breakfast attendance verified." });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDinnerCheckIn = async (studentId: string) => {
    await markChefDinner(studentId);
    setNotification({ type: "success", text: "Dinner attendance verified." });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-accent" />
          <span className="text-xs font-semibold text-base-content/60">Loading kitchen session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      {/* Header & Date Lock Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-base-200/60 border border-base-300 mb-8 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            <ChefHat className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-base-content">
                {t("chefHeading")}
              </h1>
              <span className="badge badge-accent badge-sm font-bold uppercase py-2.5 px-3">
                {t("todayOnlyBadge")}
              </span>
              <DatabaseStatusBadge />
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Active Dining Hall Attendance • Pre-Selection Verification & Red-Flag Absence Tracking
            </p>
          </div>
        </div>

        {/* Strictly Today's Operating Date Banner */}
        <div className="p-4 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-base-content/60 uppercase">
              {t("todayLabel")}
            </div>
            <div className="text-sm font-black text-base-content">
              {todayDateFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <AlertBanner
          type={notification.type}
          message={notification.text}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Real-time Kitchen Attendance Stats with Reusable StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={`Expected for ${activeSession.toUpperCase()}`}
          value={activeSession === "lunch" ? expectedLunchCount : students.length}
          icon={<Users className="w-5 h-5" />}
          subtext={activeSession === "lunch" ? "Pre-selected lunch diners" : "All registered residents"}
          colorScheme="primary"
        />

        <StatCard
          title="Checked In (Present)"
          value={
            activeSession === "lunch"
              ? presentLunchCount
              : activeSession === "breakfast"
              ? students.filter((s) => s.attendanceToday.breakfast).length
              : students.filter((s) => s.attendanceToday.dinner).length
          }
          icon={<CheckCircle2 className="w-5 h-5" />}
          subtext="Verified diners served"
          colorScheme="success"
        />

        <StatCard
          title="Marked Absent"
          value={activeSession === "lunch" ? absentLunchCount : 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          subtext="Missed lunch check-ins"
          colorScheme="error"
        />

        <StatCard
          title="Red-Flagged Residents"
          value={activeRedFlagCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          subtext="Cleared upon present check-in"
          colorScheme="warning"
        />
      </div>

      {/* Meal Session Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="tabs tabs-boxed bg-base-200 p-1.5 rounded-2xl font-bold text-xs sm:text-sm">
          <button
            onClick={() => setActiveSession("breakfast")}
            className={`tab gap-2 font-bold ${
              activeSession === "breakfast" ? "tab-active bg-accent text-accent-content" : ""
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Breakfast (All Students)</span>
          </button>

          <button
            onClick={() => setActiveSession("lunch")}
            className={`tab gap-2 font-bold ${
              activeSession === "lunch" ? "tab-active bg-accent text-accent-content" : ""
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Lunch (Pre-Selected ONLY)</span>
            <span className="badge badge-xs badge-warning ml-1 font-bold">STRICT</span>
          </button>

          <button
            onClick={() => setActiveSession("dinner")}
            className={`tab gap-2 font-bold ${
              activeSession === "dinner" ? "tab-active bg-accent text-accent-content" : ""
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dinner (All Students)</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search resident or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full sm:w-64 pl-8 text-xs font-medium rounded-xl"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-base-content/50" />
        </div>
      </div>

      {/* Strict Lunch Policy Notice */}
      {activeSession === "lunch" && (
        <div className="alert alert-info mb-6 p-4 rounded-2xl shadow-xs text-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 shrink-0 text-info mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Chef Validation Protocol:</span>
            <p className="opacity-90">{t("lunchPreSelectedStrictNote")}</p>
          </div>
        </div>
      )}

      {/* Daily Attendance Roster Table */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-xs">
            <thead className="bg-base-200/80 text-base-content/80 uppercase font-extrabold text-[11px]">
              <tr>
                <th>Resident</th>
                <th>Room</th>
                <th>Session Status</th>
                <th>Absence Red-Flag Indicator</th>
                <th>Attendance Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-base-content/60">
                    {activeSession === "lunch"
                      ? "No students have pre-selected lunch for today. Kitchen service is not required for non-selected students."
                      : "No matching student records found."}
                  </td>
                </tr>
              ) : (
                displayedStudents.map((student) => {
                  const isRedFlagged = student.isRedFlagged;
                  const lunchStatus = student.attendanceToday.lunch;
                  const isBreakfastDone = student.attendanceToday.breakfast;
                  const isDinnerDone = student.attendanceToday.dinner;

                  return (
                    <tr
                      key={student.id}
                      className={`hover transition-colors ${
                        isRedFlagged
                          ? "bg-rose-500/10 dark:bg-rose-950/20 border-l-4 border-l-rose-600"
                          : ""
                      }`}
                    >
                      {/* Resident Info */}
                      <td>
                        <div className="font-bold text-sm text-base-content flex items-center gap-2">
                          <span>{student.name}</span>
                          {isRedFlagged && (
                            <span className="badge badge-error badge-xs font-bold text-white uppercase animate-pulse">
                              RED FLAG
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-base-content/60 font-mono">
                          {student.email}
                        </div>
                      </td>

                      {/* Room */}
                      <td>
                        <span className="badge badge-outline font-bold text-xs">
                          {student.room}
                        </span>
                      </td>

                      {/* Session Pre-selection Status */}
                      <td>
                        {activeSession === "lunch" ? (
                          <span className="badge badge-primary gap-1 text-xs font-bold py-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Pre-Selected
                          </span>
                        ) : (
                          <span className="badge badge-success gap-1 text-xs font-bold py-2 text-success-content">
                            Fixed Meal
                          </span>
                        )}
                      </td>

                      {/* Absence & Red-Flag Visual Indicator */}
                      <td>
                        {isRedFlagged ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-error gap-1 text-[11px] font-black text-white py-2">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              ABSENCE RED-FLAG
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                              Missed previous meal! Check in to clear flag.
                            </span>
                          </div>
                        ) : lunchStatus === "present" || (activeSession === "breakfast" && isBreakfastDone) || (activeSession === "dinner" && isDinnerDone) ? (
                          <span className="badge badge-success gap-1 text-xs font-bold py-2 text-success-content">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified Present
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/60 font-medium">
                            Normal (Awaiting Check-in)
                          </span>
                        )}
                      </td>

                      {/* Attendance Actions */}
                      <td>
                        {activeSession === "lunch" ? (
                          <div className="flex items-center gap-2">
                            {lunchStatus === "present" ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verified Present</span>
                              </div>
                            ) : lunchStatus === "absent" ? (
                              <div className="flex items-center gap-2">
                                <span className="badge badge-error text-white font-bold text-xs py-2">
                                  Marked Absent
                                </span>
                                <button
                                  onClick={() => handleLunchStatus(student.id, "present")}
                                  className="btn btn-xs btn-outline btn-success font-bold"
                                  title="Check-in student now to clear red-flag"
                                >
                                  Clear & Present
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleLunchStatus(student.id, "present")}
                                  className="btn btn-xs btn-success text-white font-bold gap-1 shadow-xs"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Present</span>
                                </button>
                                <button
                                  onClick={() => handleLunchStatus(student.id, "absent")}
                                  className="btn btn-xs btn-outline btn-error font-bold gap-1"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Absent</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : activeSession === "breakfast" ? (
                          isBreakfastDone ? (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verified Present</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBreakfastCheckIn(student.id)}
                              className="btn btn-xs btn-accent text-accent-content font-bold gap-1 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>
                          )
                        ) : (
                          isDinnerDone ? (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verified Present</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDinnerCheckIn(student.id)}
                              className="btn btn-xs btn-accent text-accent-content font-bold gap-1 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
