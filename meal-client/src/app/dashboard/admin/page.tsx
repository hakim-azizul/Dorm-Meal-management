"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp, StudentRecord, ChefRecord, DayKey } from "@/context/MealAppContext";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  ChefHat,
  Search,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  ShieldAlert,
  Trash2,
  KeyRound,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";

const DAYS: DayKey[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export default function AdminDashboard() {
  const { t } = useLanguage();
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
    backendOnline,
  } = useMealApp();

  const [activeTab, setActiveTab] = useState<"students" | "chefs">("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "penalized" | "redflags" | "active">("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Filtering
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

  const totalWeeklyLunchesBooked = students.reduce((acc, student) => {
    const count = DAYS.filter((day) => student.schedule[day]?.lunchSelected).length;
    return acc + count;
  }, 0);

  const handleOpenPenaltyModal = (student: StudentRecord) => {
    setSelectedStudentForBlock(student);
    setPenaltyReasonText(student.penaltyReason || "Hostel noise complaint and meal violation");
  };

  const handleConfirmPenalty = async () => {
    if (selectedStudentForBlock) {
      await toggleStudentPenalty(selectedStudentForBlock.id, penaltyReasonText);
      setNotification({
        type: "success",
        text: `Meal restriction imposed on ${selectedStudentForBlock.name}. Reason: ${penaltyReasonText}`,
      });
      setSelectedStudentForBlock(null);
      setPenaltyReasonText("");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleLiftPenalty = async (student: StudentRecord) => {
    await toggleStudentPenalty(student.id);
    setNotification({
      type: "success",
      text: `Meal restriction lifted for ${student.name}.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOverrideLunch = async (studentId: string, day: DayKey) => {
    await adminOverrideStudentLunch(studentId, day);
    setNotification({
      type: "success",
      text: `Manual lunch override saved for ${day.toUpperCase()}.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail || !newStudentRoom) return;

    await addNewStudent({
      name: newStudentName,
      room: newStudentRoom,
      email: newStudentEmail,
    });

    setNotification({
      type: "success",
      text: `Student ${newStudentName} registered with default password "Dorm@1234".`,
    });

    setShowAddStudentModal(false);
    setNewStudentName("");
    setNewStudentRoom("");
    setNewStudentEmail("");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateChef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChefName || !newChefEmail) return;

    await addNewChef({
      name: newChefName,
      email: newChefEmail,
      shift: newChefShift,
    });

    setNotification({
      type: "success",
      text: `Kitchen Chef ${newChefName} added with default password "Dorm@1234".`,
    });

    setShowAddChefModal(false);
    setNewChefName("");
    setNewChefEmail("");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleConfirmResetPassword = async () => {
    if (!userToReset) return;
    const res = await adminResetPassword(userToReset.id);
    if (res.success) {
      setNotification({
        type: "success",
        text: `Password for ${userToReset.name} reset to "Dorm@1234".`,
      });
    } else {
      setNotification({
        type: "error",
        text: res.message,
      });
    }
    setUserToReset(null);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      {/* Top Banner / Global Lock Controller */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-base-content">
                  {t("adminDashboardTitle")}
                </h1>
                <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">
                  Hostel Administration
                </span>
                <span
                  className={`badge badge-xs font-bold gap-1 py-2 px-2.5 ${
                    backendOnline
                      ? "badge-success badge-outline text-emerald-600"
                      : "badge-warning badge-outline text-amber-600"
                  }`}
                >
                  {backendOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {backendOnline ? "Atlas Connected" : "Local Database"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                Manage student lunch privileges, user credentials, and global system freeze.
              </p>
            </div>
          </div>

          {/* Master Global Lock Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-300">
            <div className="text-left sm:text-right">
              <span className="block text-xs font-extrabold text-base-content uppercase tracking-wider">
                {t("globalLockStatus")}
              </span>
              <span
                className={`text-sm font-black flex items-center gap-1.5 ${
                  isGlobalLocked ? "text-error" : "text-success"
                }`}
              >
                {isGlobalLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t("locked")}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>{t("unlocked")}</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={toggleGlobalLock}
              className={`btn btn-sm sm:btn-md font-bold gap-2 shadow-xs transition-all ${
                isGlobalLocked
                  ? "btn-success text-success-content"
                  : "btn-error text-error-content"
              }`}
            >
              {isGlobalLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isGlobalLocked ? t("unlockGlobalBtn") : t("lockGlobalBtn")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live System Notification */}
      {notification && (
        <div
          className={`alert mb-6 shadow-sm rounded-2xl font-medium text-xs sm:text-sm ${
            notification.type === "success" ? "alert-success text-white" : "alert-error text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card bg-base-100 border border-base-300 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60">Total Students</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black mt-2 text-base-content">{students.length}</div>
          <span className="text-[11px] text-base-content/50 mt-1">Hostel Residents</span>
        </div>

        <div className="card bg-base-100 border border-base-300 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60">Lunches Booked</span>
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-black mt-2 text-base-content">
            {totalWeeklyLunchesBooked}
          </div>
          <span className="text-[11px] text-base-content/50 mt-1">Active Pre-selections</span>
        </div>

        <div className="card bg-base-100 border border-base-300 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60">Restricted Students</span>
            <ShieldAlert className="w-4 h-4 text-error" />
          </div>
          <div className="text-2xl font-black mt-2 text-error">{penalizedCount}</div>
          <span className="text-[11px] text-base-content/50 mt-1">Selection Blocked</span>
        </div>

        <div className="card bg-base-100 border border-base-300 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60">Red-Flagged Absences</span>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-black mt-2 text-warning">{redFlagCount}</div>
          <span className="text-[11px] text-base-content/50 mt-1">Missed Reserved Lunch</span>
        </div>
      </div>

      {/* Main Tabs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1.5 bg-base-200 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("students")}
            className={`btn btn-sm rounded-xl font-bold gap-2 transition-all ${
              activeTab === "students" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Roster ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("chefs")}
            className={`btn btn-sm rounded-xl font-bold gap-2 transition-all ${
              activeTab === "chefs" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Chefs ({chefs.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === "students" ? (
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="btn btn-sm btn-primary font-bold gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("createStudentBtn")}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddChefModal(true)}
              className="btn btn-sm btn-primary font-bold gap-1.5 shadow-xs"
            >
              <ChefHat className="w-4 h-4" />
              <span>{t("createChefBtn")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === "students" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name, room, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`badge badge-sm font-bold cursor-pointer py-3 px-3 transition-all ${
                statusFilter === "all" ? "badge-primary" : "badge-ghost opacity-60"
              }`}
            >
              All Residents ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`badge badge-sm font-bold cursor-pointer py-3 px-3 transition-all ${
                statusFilter === "active" ? "badge-success text-white" : "badge-ghost opacity-60"
              }`}
            >
              Active ({students.filter((s) => !s.isBlocked && !s.isRedFlagged).length})
            </button>
            <button
              onClick={() => setStatusFilter("penalized")}
              className={`badge badge-sm font-bold cursor-pointer py-3 px-3 transition-all ${
                statusFilter === "penalized" ? "badge-error text-white" : "badge-ghost opacity-60"
              }`}
            >
              Blocked ({penalizedCount})
            </button>
            <button
              onClick={() => setStatusFilter("redflags")}
              className={`badge badge-sm font-bold cursor-pointer py-3 px-3 transition-all ${
                statusFilter === "redflags" ? "badge-warning text-black" : "badge-ghost opacity-60"
              }`}
            >
              Red-Flagged ({redFlagCount})
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      {activeTab === "students" ? (
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/80 text-base-content/80 uppercase font-extrabold text-[11px]">
                <tr>
                  <th>Student Info</th>
                  <th>Room</th>
                  <th>Weekly Lunch Selections (Click Day to Override)</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-base-content/50">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const bookedCount = DAYS.filter((d) => student.schedule[d]?.lunchSelected).length;

                    return (
                      <tr key={student.id} className="hover">
                        {/* Student Name */}
                        <td>
                          <div className="font-bold text-sm text-base-content">
                            {student.name}
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

                        {/* Weekly Lunch Selections with Instant Admin Override */}
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {DAYS.map((day) => {
                              const isSelected = student.schedule[day]?.lunchSelected;
                              return (
                                <button
                                  key={day}
                                  onClick={() => handleOverrideLunch(student.id, day)}
                                  title={`Click to manually toggle ${day.toUpperCase()} lunch for ${student.name}`}
                                  className={`badge badge-xs font-extrabold uppercase text-[10px] py-2 px-1.5 transition-all hover:scale-110 cursor-pointer ${
                                    isSelected
                                      ? "badge-primary text-primary-content"
                                      : "badge-ghost opacity-40 line-through"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                            <span className="text-[11px] text-base-content/70 font-black ml-1">
                              ({bookedCount}/7)
                            </span>
                          </div>
                        </td>

                        {/* Status (Blocked / Red-Flagged / Active / Password Status) */}
                        <td>
                          <div className="flex flex-col gap-1">
                            {student.isBlocked && (
                              <span className="badge badge-error gap-1 text-[10px] font-bold text-white py-2">
                                <ShieldAlert className="w-3 h-3" />
                                Selection Blocked
                              </span>
                            )}
                            {student.isRedFlagged && (
                              <span className="badge badge-warning gap-1 text-[10px] font-bold text-amber-950 py-2">
                                <AlertTriangle className="w-3 h-3" />
                                Red-Flagged Absent
                              </span>
                            )}
                            {!student.isBlocked && !student.isRedFlagged && (
                              <span className="badge badge-success gap-1 text-[10px] font-bold text-success-content py-2">
                                <CheckCircle2 className="w-3 h-3" />
                                Normal & Permitted
                              </span>
                            )}
                            {student.isPasswordReset && (
                              <span className="badge badge-outline badge-info gap-1 text-[10px] font-bold py-1">
                                <KeyRound className="w-3 h-3" />
                                Default Pass Active
                              </span>
                            )}
                            {student.penaltyReason && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                                {student.penaltyReason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions: Block / Reset Password / Delete */}
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {student.isBlocked ? (
                              <button
                                onClick={() => handleLiftPenalty(student)}
                                className="btn btn-xs btn-outline btn-success font-bold gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t("unblockStudentBtn")}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenPenaltyModal(student)}
                                className="btn btn-xs btn-outline btn-error font-bold gap-1"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                <span>{t("blockStudentBtn")}</span>
                              </button>
                            )}

                            {/* Reset Password Button */}
                            <button
                              onClick={() => setUserToReset({ id: student.id, name: student.name, role: "Student" })}
                              className="btn btn-xs btn-outline btn-warning font-bold gap-1"
                              title="Reset Password back to default 'Dorm@1234'"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset Pass</span>
                            </button>

                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="btn btn-xs btn-ghost btn-circle text-error hover:bg-error/10"
                              title="Delete Student Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Chefs Table */
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/80 text-base-content/80 uppercase font-extrabold text-[11px]">
                <tr>
                  <th>Chef Name</th>
                  <th>Email</th>
                  <th>Shift Assignment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chefs.map((chef) => (
                  <tr key={chef.id} className="hover">
                    <td className="font-bold text-sm text-base-content flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-emerald-500" />
                      <span>{chef.name}</span>
                    </td>
                    <td className="font-mono text-base-content/70">{chef.email}</td>
                    <td>
                      <span className="badge badge-outline badge-primary font-bold">
                        {chef.shift}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-success badge-xs font-bold text-success-content">
                          Active Kitchen Staff
                        </span>
                        {chef.isPasswordReset && (
                          <span className="badge badge-outline badge-info badge-xs font-bold gap-1">
                            <KeyRound className="w-2.5 h-2.5" />
                            Default Pass Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setUserToReset({ id: chef.id, name: chef.name, role: "Chef" })}
                          className="btn btn-xs btn-outline btn-warning font-bold gap-1"
                          title="Reset Password back to default 'Dorm@1234'"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Pass</span>
                        </button>

                        <button
                          onClick={() => deleteChef(chef.id)}
                          className="btn btn-xs btn-ghost btn-circle text-error hover:bg-error/10"
                          title="Remove Chef Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Reset Password Confirmation */}
      {userToReset && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base text-amber-600 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => setUserToReset(null)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-base-content/80 leading-relaxed">
                Are you sure you want to reset the password for{" "}
                <span className="font-bold text-base-content">{userToReset.name}</span> ({userToReset.role})?
              </p>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                Password will be restored to: <strong className="font-mono text-primary font-black">Dorm@1234</strong>
                <br />
                User will be marked with <code className="font-bold">isPasswordReset: true</code> until they change it.
              </div>
            </div>

            <div className="modal-action border-t border-base-200 pt-3">
              <button
                type="button"
                onClick={() => setUserToReset(null)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="btn btn-sm btn-warning font-bold gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Block Student Meal Selection */}
      {selectedStudentForBlock && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Impose Meal Selection Block</span>
              </h3>
              <button
                onClick={() => setSelectedStudentForBlock(null)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-base-content/80 leading-relaxed">
                Blocking will immediately freeze lunch modification permissions for{" "}
                <span className="font-bold text-base-content">{selectedStudentForBlock.name}</span>.
              </p>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">
                    Disciplinary Penalty / Reason
                  </span>
                </label>
                <textarea
                  value={penaltyReasonText}
                  onChange={(e) => setPenaltyReasonText(e.target.value)}
                  placeholder="e.g., Hostel noise complaint or unauthorized guest violation"
                  rows={3}
                  className="textarea textarea-bordered text-xs focus:textarea-primary"
                />
              </div>
            </div>

            <div className="modal-action border-t border-base-200 pt-3">
              <button
                type="button"
                onClick={() => setSelectedStudentForBlock(null)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPenalty}
                className="btn btn-sm btn-error font-bold text-white gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Enforce Restriction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Student */}
      {showAddStudentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>Register New Student</span>
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="py-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Tariq Bin Ziyad"
                  className="input input-sm input-bordered text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="tariq@hostel.edu"
                  className="input input-sm input-bordered text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Room Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentRoom}
                  onChange={(e) => setNewStudentRoom(e.target.value)}
                  placeholder="e.g. B-205"
                  className="input input-sm input-bordered text-xs focus:input-primary"
                />
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl border border-base-300 text-[11px] text-base-content/70">
                Default password will be set automatically to:{" "}
                <strong className="text-primary font-mono font-black">Dorm@1234</strong>
                <br />
                User will be prompted with <code className="font-bold">isPasswordReset: true</code>.
              </div>

              <div className="modal-action border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary font-bold">
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Chef */}
      {showAddChefModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                <span>Add Kitchen Chef Account</span>
              </h3>
              <button
                onClick={() => setShowAddChefModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChef} className="py-4 space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Chef Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChefName}
                  onChange={(e) => setNewChefName(e.target.value)}
                  placeholder="e.g. Chef Youssef Al-Hassan"
                  className="input input-sm input-bordered text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={newChefEmail}
                  onChange={(e) => setNewChefEmail(e.target.value)}
                  placeholder="youssef@hostel.edu"
                  className="input input-sm input-bordered text-xs focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Assigned Shift</span>
                </label>
                <select
                  value={newChefShift}
                  onChange={(e) => setNewChefShift(e.target.value)}
                  className="select select-sm select-bordered text-xs focus:select-primary"
                >
                  <option value="Morning & Lunch Session">Morning & Lunch Session</option>
                  <option value="Lunch & Evening Session">Lunch & Evening Session</option>
                  <option value="Full Day Mess Manager">Full Day Mess Manager</option>
                </select>
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl border border-base-300 text-[11px] text-base-content/70">
                Default password will be set automatically to:{" "}
                <strong className="text-primary font-mono font-black">Dorm@1234</strong>
                <br />
                User will be prompted with <code className="font-bold">isPasswordReset: true</code>.
              </div>

              <div className="modal-action border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddChefModal(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary font-bold">
                  Create Chef
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
