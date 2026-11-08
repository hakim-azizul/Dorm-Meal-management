"use client";

import React, { useState } from "react";
import { useMealApp, StudentRecord, DayKey } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
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

  const [activeTab, setActiveTab] = useState<"students" | "chefs">("students");
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

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-md text-secondary" />
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

        {/* Top Control Bar: Search, Stats, & Actions */}
        <div className="p-3 sm:p-4 rounded-2xl bg-base-200/60 border border-base-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          {/* Tabs: Students / Chefs */}
          <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300 shrink-0">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "students"
                  ? "bg-secondary text-secondary-content shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Students ({students.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("chefs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "chefs"
                  ? "bg-secondary text-secondary-content shadow-xs"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Chefs ({chefs.length})</span>
            </button>
          </div>

          {/* Quick Metrics & Add Button */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="badge badge-sm badge-error text-white font-bold gap-1">
                {penalizedCount} Suspended
              </span>
              <span className="badge badge-sm badge-warning font-bold gap-1">
                {redFlagCount} Flagged
              </span>
            </div>

            {activeTab === "students" ? (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn btn-sm btn-secondary rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddChefModal(true)}
                className="btn btn-sm btn-secondary rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Chef</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Lock Warning Banner if active */}
        {isGlobalLocked && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Global Lock is Active — All student choices are frozen.</span>
            </div>
            <button
              onClick={toggleGlobalLock}
              className="btn btn-xs btn-warning font-bold rounded-lg"
            >
              Unlock Now
            </button>
          </div>
        )}

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
                        ? "btn-secondary text-secondary-content"
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
                      ? "border-secondary ring-1 ring-secondary/30 shadow-xs"
                      : "border-base-300 hover:border-base-400"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary font-black text-sm flex items-center justify-center shrink-0">
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
                            <span className="badge badge-sm badge-warning font-bold gap-1 text-[10px]">
                              <AlertTriangle className="w-2.5 h-2.5" /> Red Flag
                            </span>
                          ) : (
                            <span className="badge badge-sm badge-success text-success-content font-bold text-[10px]">
                              Active
                            </span>
                          )}

                          {student.isPasswordReset && (
                            <span className="badge badge-sm badge-ghost text-[9px] font-semibold text-warning">
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
                                ? "bg-primary text-primary-content shadow-xs"
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
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-black text-sm flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-base-content truncate">
                        {chef.name}
                      </span>
                      <span className="badge badge-sm badge-accent font-semibold text-[10px]">
                        {chef.shift}
                      </span>
                      {chef.isPasswordReset && (
                        <span className="badge badge-sm badge-ghost text-[9px] font-semibold text-warning">
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
              <UserPlus className="w-5 h-5 text-secondary" />
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
                  className="btn btn-sm btn-secondary rounded-xl text-xs font-bold"
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
              <ChefHat className="w-5 h-5 text-accent" />
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
                  className="btn btn-sm btn-secondary rounded-xl text-xs font-bold"
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
              <KeyRound className="w-5 h-5 text-warning" />
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
                className="btn btn-sm btn-warning rounded-xl text-xs font-bold"
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
