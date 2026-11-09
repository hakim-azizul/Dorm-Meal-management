"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMealApp, StudentRecord, DayKey } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  getAttendanceAndMealReportAction,
  ReportItemRecord,
  AttendanceReportSummary,
} from "@/app/actions/mealActions";
import {
  Users,
  ChefHat,
  Search,
  UserPlus,
  AlertTriangle,
  X,
  ShieldAlert,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

const DAYS: DayKey[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export default function AdminDashboard() {
  const {
    isGlobalLocked,
    toggleGlobalLock,
    students,
    chefs,
    toggleStudentPenalty,
    adminOverrideStudentLunch,
    addNewStudent,
    deleteStudent,
    addNewChef,
    deleteChef,
    adminResetPassword,
    isHydrated,
    isSidebarOpen,
    closeSidebar,
  } = useMealApp();

  const [activeTab, setActiveTab] = useState<"students" | "chefs" | "reports">("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "penalized" | "redflags" | "active">("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected student for quick focus from sidebar
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  // Punishment Modal
  const [selectedStudentForBlock, setSelectedStudentForBlock] = useState<StudentRecord | null>(null);
  const [penaltyReasonText, setPenaltyReasonText] = useState("");

  // Create Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoom, setNewStudentRoom] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");

  // Create Chef Modal
  const [showAddChefModal, setShowAddChefModal] = useState(false);
  const [newChefName, setNewChefName] = useState("");
  const [newChefEmail, setNewChefEmail] = useState("");
  const [newChefShift, setNewChefShift] = useState("Morning & Lunch Session");

  // Reset Password Confirmation Modal
  const [userToReset, setUserToReset] = useState<{ id: string; name: string; role: string } | null>(null);

  // ============================================================================
  // REPORT MODULE STATE
  // ============================================================================
  const getInitialDates = () => {
    const today = new Date();
    const to = today.toISOString().split("T")[0];
    const past7 = new Date(today);
    past7.setDate(today.getDate() - 6);
    const from = past7.toISOString().split("T")[0];
    return { from, to };
  };

  const [reportFromDate, setReportFromDate] = useState<string>(() => getInitialDates().from);
  const [reportToDate, setReportToDate] = useState<string>(() => getInitialDates().to);
  const [reportRecords, setReportRecords] = useState<ReportItemRecord[]>([]);
  const [reportSummary, setReportSummary] = useState<AttendanceReportSummary | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [reportSearch, setReportSearch] = useState<string>("");
  const [reportMealFilter, setReportMealFilter] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "present" | "absent" | "unmarked">("all");

  const loadReportData = useCallback(async (from?: string, to?: string) => {
    setIsLoadingReport(true);
    try {
      const res = await getAttendanceAndMealReportAction({
        fromDate: from || reportFromDate,
        toDate: to || reportToDate,
      });

      if (res.success && res.records && res.summary) {
        setReportRecords(res.records);
        setReportSummary(res.summary);
      } else {
        setNotification({
          type: "error",
          text: res.message || "Failed to load attendance report.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating report.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsLoadingReport(false);
    }
  }, [reportFromDate, reportToDate]);

  // Lazy-load report when switching to Reports tab
  useEffect(() => {
    if (activeTab === "reports" && reportRecords.length === 0 && !isLoadingReport) {
      void loadReportData();
    }
  }, [activeTab, reportRecords.length, isLoadingReport, loadReportData]);

  // Presets handler
  const handleApplyPreset = (preset: "today" | "yesterday" | "thisWeek" | "last7" | "last30") => {
    const now = new Date();
    let from = "";
    let to = "";

    if (preset === "today") {
      from = now.toISOString().split("T")[0];
      to = from;
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      from = y.toISOString().split("T")[0];
      to = from;
    } else if (preset === "thisWeek") {
      // Sat to Fri
      const day = now.getDay();
      const diffToSat = day === 6 ? 0 : -(day + 1);
      const sat = new Date(now);
      sat.setDate(now.getDate() + diffToSat);
      from = sat.toISOString().split("T")[0];
      const fri = new Date(sat);
      fri.setDate(sat.getDate() + 6);
      to = fri.toISOString().split("T")[0];
    } else if (preset === "last7") {
      to = now.toISOString().split("T")[0];
      const p = new Date(now);
      p.setDate(now.getDate() - 6);
      from = p.toISOString().split("T")[0];
    } else if (preset === "last30") {
      to = now.toISOString().split("T")[0];
      const p = new Date(now);
      p.setDate(now.getDate() - 29);
      from = p.toISOString().split("T")[0];
    }

    setReportFromDate(from);
    setReportToDate(to);
    void loadReportData(from, to);
  };

  // CSV Export
  const handleDownloadCsv = () => {
    if (!reportRecords.length) {
      setNotification({ type: "error", text: "No records to download. Please generate a report first." });
      return;
    }

    const headers = [
      "Date",
      "Day",
      "Student Name",
      "Hostel Room",
      "Email",
      "Meal Session",
      "Meal Selection",
      "Attendance Status",
      "Disciplinary Status",
      "Flag Status",
      "Penalty Note",
    ];

    const rows = filteredReportRecords.map((r) => [
      `"${r.date}"`,
      `"${r.day.toUpperCase()}"`,
      `"${(r.studentName || "").replace(/"/g, '""')}"`,
      `"${(r.room || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${r.mealType.toUpperCase()}"`,
      `"${r.booked ? (r.mealType === "lunch" ? "Lunch Booked" : "Guaranteed") : "Opted-Out"}"`,
      `"${r.attendanceStatus.toUpperCase()}"`,
      `"${r.isBlocked ? "Suspended" : "Active"}"`,
      `"${r.isRedFlagged ? "Red-Flagged" : "Normal"}"`,
      `"${(r.penaltyReason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Meal_Attendance_Report_${reportFromDate}_to_${reportToDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      type: "success",
      text: `Report downloaded successfully (${filteredReportRecords.length} records).`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered report records
  const filteredReportRecords = reportRecords.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.room.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.date.includes(reportSearch);

    if (!matchesSearch) return false;
    if (reportMealFilter !== "all" && r.mealType !== reportMealFilter) return false;
    if (reportStatusFilter !== "all" && r.attendanceStatus !== reportStatusFilter) return false;
    return true;
  });

  // Quick select student from sidebar
  const handleSelectStudentFromSidebar = (stu: StudentRecord) => {
    setSelectedStudentId(stu.id);
    setActiveTab("students");
    setSearchTerm(stu.name);
    closeSidebar();
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "penalized") return s.isBlocked;
    if (statusFilter === "redflags") return s.isRedFlagged;
    if (statusFilter === "active") return !s.isBlocked && !s.isRedFlagged;
    return true;
  });

  const penalizedCount = students.filter((s) => s.isBlocked).length;
  const redFlagCount = students.filter((s) => s.isRedFlagged).length;

  const handleOpenPenaltyModal = (student: StudentRecord) => {
    setSelectedStudentForBlock(student);
    setPenaltyReasonText(student.penaltyReason || "Hostel noise complaint or mess policy violation");
  };

  const handleConfirmPenalty = async () => {
    if (selectedStudentForBlock) {
      await toggleStudentPenalty(selectedStudentForBlock.id, penaltyReasonText);
      setNotification({
        type: "success",
        text: `Meal restriction set for ${selectedStudentForBlock.name}`,
      });
      setSelectedStudentForBlock(null);
      setPenaltyReasonText("");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLiftPenalty = async (student: StudentRecord) => {
    await toggleStudentPenalty(student.id);
    setNotification({
      type: "success",
      text: `Meal restriction lifted for ${student.name}`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOverrideLunch = async (studentId: string, day: DayKey) => {
    await adminOverrideStudentLunch(studentId, day);
    setNotification({
      type: "success",
      text: `Lunch override updated for ${day.toUpperCase()}`,
    });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail || !newStudentRoom) return;

    const res = await addNewStudent({
      name: newStudentName,
      room: newStudentRoom,
      email: newStudentEmail,
    });

    if (res.success) {
      setNotification({
        type: "success",
        text: `Student ${newStudentName} created (Password: Dorm@1234)`,
      });
      setShowAddStudentModal(false);
      setNewStudentName("");
      setNewStudentRoom("");
      setNewStudentEmail("");
    } else {
      setNotification({
        type: "error",
        text: res.message || "Failed to create student",
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateChef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChefName || !newChefEmail) return;

    const res = await addNewChef({
      name: newChefName,
      email: newChefEmail,
      shift: newChefShift,
    });

    if (res.success) {
      setNotification({
        type: "success",
        text: `Chef ${newChefName} created (Password: Dorm@1234)`,
      });
      setShowAddChefModal(false);
      setNewChefName("");
      setNewChefEmail("");
    } else {
      setNotification({
        type: "error",
        text: res.message || "Failed to create chef",
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmResetPassword = async () => {
    if (!userToReset) return;
    const res = await adminResetPassword(userToReset.id);
    if (res.success) {
      setNotification({
        type: "success",
        text: `Password for ${userToReset.name} reset to "Dorm@1234"`,
      });
    } else {
      setNotification({ type: "error", text: res.message });
    }
    setUserToReset(null);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGlobalLockToggle = async () => {
    await toggleGlobalLock();
    setNotification({
      type: "success",
      text: !isGlobalLocked
        ? "Global Lock ACTIVATED: All student meal selections are now frozen."
        : "Global Lock DEACTIVATED: Students can now freely update meal selections.",
    });
    setTimeout(() => setNotification(null), 3500);
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-md text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-base-100">
      {/* 1. Responsive Sidebar with User Profile & Quick Student List */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onSelectStudent={handleSelectStudentFromSidebar}
        selectedStudentId={selectedStudentId}
        adminTab={activeTab}
        onAdminTabChange={setActiveTab}
      />

      {/* 2. Main Admin Dashboard Area */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-4">
        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* ====================================================================
            GLOBAL MEAL SELECTION CONTROL CARD (PROMINENT & REACTIVE)
            ==================================================================== */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            isGlobalLocked
              ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isGlobalLocked
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isGlobalLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base">
                  {isGlobalLocked
                    ? "Global Selection: FROZEN (LOCKED)"
                    : "Global Selection: ACTIVE (UNLOCKED)"}
                </span>
                <span
                  className={`badge badge-sm font-black text-[10px] uppercase py-2 px-2.5 ${
                    isGlobalLocked
                      ? "badge-error text-white"
                      : "badge-success text-success-content"
                  }`}
                >
                  {isGlobalLocked ? "Frozen" : "Open for Students"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs opacity-80 mt-0.5">
                {isGlobalLocked
                  ? "Student meal choices are currently frozen across the system. Students cannot modify selections."
                  : "Students can freely customize and save their meal selections. Toggle to freeze whenever needed."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGlobalLockToggle}
            className={`btn btn-sm rounded-xl font-bold text-xs shrink-0 self-start sm:self-center border-none shadow-xs text-white ${
              isGlobalLocked
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isGlobalLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Re-Open Selections</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Freeze Selections</span>
              </>
            )}
          </button>
        </div>

        {/* Top Control Bar: Tabs, Search, Metrics & Actions */}
        <div className="p-3 sm:p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          {/* Tabs: Students / Chefs / Reports */}
          <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "students"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Students ({students.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("chefs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "chefs"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Chefs ({chefs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "reports"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Reports & Downloads</span>
            </button>
          </div>

          {/* Quick Metrics & Action Buttons */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="badge badge-sm badge-error text-white font-bold gap-1">
                {penalizedCount} Suspended
              </span>
              <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold gap-1 text-[11px]">
                {redFlagCount} Flagged
              </span>
            </div>

            {activeTab === "students" && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            )}

            {activeTab === "chefs" && (
              <button
                onClick={() => setShowAddChefModal(true)}
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Chef</span>
              </button>
            )}

            {activeTab === "reports" && (
              <button
                onClick={handleDownloadCsv}
                disabled={reportRecords.length === 0}
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* ====================================================================
            TAB 1: STUDENT MANAGEMENT & ROSTER
            ==================================================================== */}
        {activeTab === "students" && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name, room, or email..."
                  className="input input-sm w-full bg-base-100 rounded-xl border-base-300 ps-9 pe-8 text-xs font-medium"
                />
                <Search className="w-4 h-4 text-base-content/40 absolute start-3 top-2.5" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute end-2.5 top-2.5 text-base-content/40 hover:text-base-content"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["all", "active", "penalized", "redflags"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`btn btn-xs rounded-lg capitalize font-bold ${
                      statusFilter === filter
                        ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 border-none"
                        : "btn-ghost bg-base-200/60 text-base-content/70"
                    }`}
                  >
                    {filter === "all"
                      ? "All"
                      : filter === "redflags"
                      ? "Flagged"
                      : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Students List: Responsive Cards */}
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  id={`student-${student.id}`}
                  className={`p-3 sm:p-4 rounded-2xl bg-base-100 border transition-all ${
                    selectedStudentId === student.id
                      ? "border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs"
                      : "border-base-300 hover:border-base-400"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-sm flex items-center justify-center shrink-0">
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

                          {student.isBlocked ? (
                            <span className="badge badge-sm badge-error text-white font-bold gap-1 text-[10px]">
                              <ShieldAlert className="w-2.5 h-2.5" /> Suspended
                            </span>
                          ) : student.isRedFlagged ? (
                            <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold gap-1 text-[10px]">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Red Flag
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

                    {/* Middle: Day-by-Day Meal Override Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 lg:py-0">
                      <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider me-1">
                        Override:
                      </span>
                      {DAYS.map((day) => {
                        const isSelected = student.schedule[day]?.lunchSelected;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleOverrideLunch(student.id, day)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                              isSelected
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                      {student.isBlocked ? (
                        <button
                          onClick={() => handleLiftPenalty(student)}
                          className="btn btn-xs btn-outline btn-success font-bold rounded-lg text-[10px]"
                        >
                          Lift Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPenaltyModal(student)}
                          className="btn btn-xs btn-outline btn-error font-bold rounded-lg text-[10px]"
                        >
                          Block
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setUserToReset({ id: student.id, name: student.name, role: "Student" })
                        }
                        className="btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-base-content"
                        title="Reset Password to Dorm@1234"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="p-8 rounded-2xl bg-base-100 border border-base-300 text-center text-xs text-base-content/60">
                  No students matching your filter criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: KITCHEN CHEFS
            ==================================================================== */}
        {activeTab === "chefs" && (
          <div className="space-y-2">
            {chefs.map((chef) => (
              <div
                key={chef.id}
                className="p-3 sm:p-4 rounded-2xl bg-base-100 border border-base-300 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-sm flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-base-content truncate">
                        {chef.name}
                      </span>
                      <span className="badge badge-sm badge-ghost font-semibold text-[10px]">
                        {chef.shift}
                      </span>
                      {chef.isPasswordReset && (
                        <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                          Default Pass
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-base-content/60 truncate mt-0.5">
                      {chef.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() =>
                      setUserToReset({ id: chef.id, name: chef.name, role: "Chef" })
                    }
                    className="btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-base-content"
                    title="Reset Password to Dorm@1234"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteChef(chef.id)}
                    className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error"
                    title="Delete Chef"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {chefs.length === 0 && (
              <div className="p-8 rounded-2xl bg-base-100 border border-base-300 text-center text-xs text-base-content/60">
                No chefs currently registered.
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 3: ATTENDANCE & MEAL REPORT GENERATOR & DOWNLOAD
            ==================================================================== */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Filter & Range Controls Card */}
            <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-3.5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-base-content flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Attendance & Meal Records Export</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
                    Select a date range to filter check-ins and meal bookings across the hostel dining hall.
                  </p>
                </div>

                {/* Quick Range Presets */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("today")}
                    className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("yesterday")}
                    className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("thisWeek")}
                    className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("last7")}
                    className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("last30")}
                    className="btn btn-xs rounded-lg btn-ghost bg-base-200 hover:bg-base-300 font-bold text-[11px]"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Exact Date Range Form & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-base-200">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="input input-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="input input-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
                    Meal Type
                  </label>
                  <select
                    value={reportMealFilter}
                    onChange={(e) => setReportMealFilter(e.target.value as "all" | "breakfast" | "lunch" | "dinner")}
                    className="select select-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
                  >
                    <option value="all">All Meals</option>
                    <option value="breakfast">Breakfast Only</option>
                    <option value="lunch">Lunch Only</option>
                    <option value="dinner">Dinner Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-base-content/50 block mb-1">
                    Attendance Status
                  </label>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value as "all" | "present" | "absent" | "unmarked")}
                    className="select select-sm w-full bg-base-200/60 rounded-xl border-base-300 text-xs font-semibold"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present (Attended)</option>
                    <option value="absent">Absent (Missed)</option>
                    <option value="unmarked">Unmarked (Pending)</option>
                  </select>
                </div>

                <div className="flex items-end gap-1.5">
                  <button
                    type="button"
                    disabled={isLoadingReport}
                    onClick={() => void loadReportData(reportFromDate, reportToDate)}
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold flex-1 gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReport ? "animate-spin" : ""}`} />
                    <span>{isLoadingReport ? "Loading..." : "Filter"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={reportRecords.length === 0}
                    className="btn btn-sm bg-base-200 hover:bg-base-300 text-base-content rounded-xl text-xs font-bold gap-1 shadow-xs"
                    title="Download Formatted CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* High-Level Metric Cards */}
            {reportSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 block">
                    Range Slots
                  </span>
                  <span className="text-lg font-black text-base-content mt-0.5 block">
                    {reportSummary.totalRecords}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Across {reportSummary.totalStudents} students
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Meals Served
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {reportSummary.totalPresent}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Verified Present
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    Missed Lunches
                  </span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {reportSummary.totalLunchesMissed}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Booked but Absent
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Lunches Booked
                  </span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {reportSummary.totalLunchesBooked}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Opt-in lunches
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                    Red-Flagged
                  </span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5 block">
                    {reportSummary.flaggedCount}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Active disciplinary flags
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 block">
                    Unmarked Slots
                  </span>
                  <span className="text-lg font-black text-base-content/70 mt-0.5 block">
                    {reportSummary.totalUnmarked}
                  </span>
                  <span className="text-[10px] text-base-content/60">
                    Pending chef check-in
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Data Preview Table */}
            <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-base-content">
                    Report Data Preview
                  </span>
                  <span className="badge badge-sm bg-base-200 text-base-content font-bold text-[10px]">
                    {filteredReportRecords.length} records
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search preview by name or room..."
                    className="input input-xs w-full bg-base-200/60 rounded-lg ps-7 pe-2 text-xs border-base-300"
                  />
                  <Search className="w-3 h-3 text-base-content/40 absolute start-2 top-2" />
                </div>
              </div>

              {isLoadingReport ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-md text-emerald-600" />
                  <p className="text-xs text-base-content/60">Compiling date range records from database...</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[480px]">
                  <table className="table table-xs w-full">
                    <thead className="sticky top-0 bg-base-100 border-b border-base-200 text-base-content/60">
                      <tr>
                        <th>Date & Day</th>
                        <th>Student</th>
                        <th>Room</th>
                        <th>Meal Session</th>
                        <th>Selection State</th>
                        <th>Attendance</th>
                        <th>Disciplinary Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportRecords.slice(0, 100).map((record) => (
                        <tr key={record.id} className="hover:bg-base-200/40">
                          <td className="font-semibold text-base-content">
                            <div>{record.date}</div>
                            <div className="text-[10px] text-base-content/50 uppercase">{record.day}</div>
                          </td>
                          <td>
                            <div className="font-bold text-base-content">{record.studentName}</div>
                            <div className="text-[10px] text-base-content/50 truncate max-w-44">{record.email}</div>
                          </td>
                          <td className="font-semibold">{record.room}</td>
                          <td>
                            <span className="badge badge-xs badge-ghost font-bold uppercase text-[9px] py-1 px-1.5">
                              {record.mealType}
                            </span>
                          </td>
                          <td>
                            {record.booked ? (
                              <span className="badge badge-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-[9px]">
                                {record.mealType === "lunch" ? "Booked Yes" : "Guaranteed"}
                              </span>
                            ) : (
                              <span className="badge badge-xs badge-ghost text-base-content/50 font-bold text-[9px]">
                                Opted-out
                              </span>
                            )}
                          </td>
                          <td>
                            {record.attendanceStatus === "present" ? (
                              <span className="badge badge-xs badge-success text-success-content font-bold text-[9px]">
                                Present
                              </span>
                            ) : record.attendanceStatus === "absent" ? (
                              <span className="badge badge-xs badge-error text-white font-bold text-[9px]">
                                Absent
                              </span>
                            ) : (
                              <span className="badge badge-xs badge-ghost font-semibold text-base-content/50 text-[9px]">
                                Unmarked
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {record.isBlocked ? (
                                <span className="badge badge-xs badge-error text-white font-bold text-[9px]">
                                  Suspended
                                </span>
                              ) : record.isRedFlagged ? (
                                <span className="badge badge-xs bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold text-[9px]">
                                  Flagged
                                </span>
                              ) : (
                                <span className="badge badge-xs badge-ghost text-base-content/50 text-[9px]">
                                  Normal
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredReportRecords.length > 100 && (
                    <div className="p-2.5 text-center text-xs text-base-content/60 bg-base-200/40 rounded-b-xl border-t border-base-200">
                      Showing first 100 of {filteredReportRecords.length} records. Download CSV for the complete comprehensive dataset.
                    </div>
                  )}

                  {filteredReportRecords.length === 0 && !isLoadingReport && (
                    <div className="py-8 text-center text-xs text-base-content/60">
                      No records found for the selected date range and filter criteria.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL: IMPOSE PENALTY / BLOCK STUDENT
          ==================================================================== */}
      {selectedStudentForBlock && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box rounded-3xl p-5 max-w-sm">
            <h3 className="font-extrabold text-base text-error flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Suspend Meal Privileges</span>
            </h3>
            <p className="text-xs text-base-content/70 mt-1">
              Student: <strong>{selectedStudentForBlock.name}</strong> ({selectedStudentForBlock.room})
            </p>

            <div className="mt-3 space-y-2">
              <label className="text-[11px] font-bold text-base-content/70">
                Administrative Reason
              </label>
              <textarea
                value={penaltyReasonText}
                onChange={(e) => setPenaltyReasonText(e.target.value)}
                placeholder="Specify violation..."
                rows={3}
                className="textarea textarea-sm w-full bg-base-200/60 rounded-xl text-xs"
              />
            </div>

            <div className="modal-action mt-4">
              <button
                onClick={() => setSelectedStudentForBlock(null)}
                className="btn btn-sm btn-ghost rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPenalty}
                className="btn btn-sm btn-error text-white rounded-xl text-xs font-bold"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD NEW STUDENT
          ==================================================================== */}
      {showAddStudentModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box rounded-3xl p-5 max-w-md">
            <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Register Student</span>
            </h3>

            <form onSubmit={handleCreateStudent} className="space-y-3 mt-3">
              <div>
                <label className="text-[11px] font-bold text-base-content/70">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70">Hostel Room</label>
                <input
                  type="text"
                  required
                  value={newStudentRoom}
                  onChange={(e) => setNewStudentRoom(e.target.value)}
                  placeholder="e.g. B-204"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@hostel.edu"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <p className="text-[10px] text-base-content/50">
                Default password will be set to <code>Dorm@1234</code>. Student will be prompted to change it on first login.
              </p>

              <div className="modal-action mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD NEW CHEF
          ==================================================================== */}
      {showAddChefModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box rounded-3xl p-5 max-w-md">
            <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Register Mess Chef</span>
            </h3>

            <form onSubmit={handleCreateChef} className="space-y-3 mt-3">
              <div>
                <label className="text-[11px] font-bold text-base-content/70">Full Name</label>
                <input
                  type="text"
                  required
                  value={newChefName}
                  onChange={(e) => setNewChefName(e.target.value)}
                  placeholder="e.g. Chef Kareem"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70">Shift Schedule</label>
                <input
                  type="text"
                  required
                  value={newChefShift}
                  onChange={(e) => setNewChefShift(e.target.value)}
                  placeholder="e.g. Lunch & Dinner Shift"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70">Email Address</label>
                <input
                  type="email"
                  required
                  value={newChefEmail}
                  onChange={(e) => setNewChefEmail(e.target.value)}
                  placeholder="chef@hostel.edu"
                  className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
                />
              </div>

              <div className="modal-action mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddChefModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold"
                >
                  Create Chef
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: RESET PASSWORD CONFIRMATION
          ==================================================================== */}
      {userToReset && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box rounded-3xl p-5 max-w-sm">
            <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Reset Password</span>
            </h3>
            <p className="text-xs text-base-content/70 mt-2">
              Reset password for <strong>{userToReset.name}</strong> ({userToReset.role}) back to default: <code>Dorm@1234</code>?
            </p>

            <div className="modal-action mt-4">
              <button
                onClick={() => setUserToReset(null)}
                className="btn btn-sm btn-ghost rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl text-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
