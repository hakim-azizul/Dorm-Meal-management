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
  Edit3,
  SlidersHorizontal,
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
  } = useMealApp();

  const [activeTab, setActiveTab] = useState<"students" | "chefs">("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "penalized" | "redflags" | "active">("all");

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

  // Filtering
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "penalized") return s.isPenalized;
    if (statusFilter === "redflags") return s.isRedFlagged;
    if (statusFilter === "active") return !s.isPenalized && !s.isRedFlagged;
    return true;
  });

  const penalizedCount = students.filter((s) => s.isPenalized).length;
  const redFlagCount = students.filter((s) => s.isRedFlagged).length;

  const totalWeeklyLunchesBooked = students.reduce((acc, student) => {
    const count = DAYS.filter((day) => student.schedule[day]?.lunchSelected).length;
    return acc + count;
  }, 0);

  const handleOpenPenaltyModal = (student: StudentRecord) => {
    setSelectedStudentForBlock(student);
    setPenaltyReasonText(student.penaltyReason || "Hostel noise complaint and meal violation");
  };

  const handleConfirmPenalty = () => {
    if (selectedStudentForBlock) {
      toggleStudentPenalty(selectedStudentForBlock.id, penaltyReasonText);
      setSelectedStudentForBlock(null);
      setPenaltyReasonText("");
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName && newStudentRoom && newStudentEmail) {
      addNewStudent({
        name: newStudentName,
        room: newStudentRoom,
        email: newStudentEmail,
      });
      setNewStudentName("");
      setNewStudentRoom("");
      setNewStudentEmail("");
      setShowAddStudentModal(false);
    }
  };

  const handleCreateChef = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChefName && newChefEmail) {
      addNewChef({
        name: newChefName,
        email: newChefEmail,
        shift: newChefShift,
      });
      setNewChefName("");
      setNewChefEmail("");
      setShowAddChefModal(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      {/* Header & Global Lock Control Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-base-200/60 border border-base-300 mb-8 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content">
              {t("adminHeading")}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Hostel Warden Master Controls • Disciplinary Enforcement & Account Management
            </p>
          </div>
        </div>

        {/* Global Lock Switch (Locks after Friday) */}
        <div className="flex items-center justify-between sm:justify-start gap-4 p-4 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-base-content/60">
              {t("globalLockSwitch")}
            </div>
            <div
              className={`text-xs font-black mt-0.5 ${
                isGlobalLocked ? "text-error" : "text-success"
              }`}
            >
              {isGlobalLocked ? t("lockActive") : t("lockInactive")}
            </div>
          </div>

          <button
            onClick={toggleGlobalLock}
            className={`btn btn-sm gap-2 font-bold shadow-xs transition-all ${
              isGlobalLocked
                ? "btn-error text-white"
                : "btn-outline btn-success"
            }`}
          >
            {isGlobalLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock For Friday</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Lock All Choices</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-base-content/60 uppercase">
              {t("totalStudents")}
            </span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-base-content">{students.length}</div>
          <span className="text-[11px] text-base-content/60">Registered Hostel Residents</span>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-base-content/60 uppercase">
              {t("activePenalties")}
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{penalizedCount}</div>
          <span className="text-[11px] text-rose-500/80 font-bold">Meal Choices Blocked</span>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-base-content/60 uppercase">
              {t("redFlaggedStudents")}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{redFlagCount}</div>
          <span className="text-[11px] text-amber-600/80 font-bold">Missed Meal Absentees</span>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-base-content/60 uppercase">
              {t("weeklyLunches")}
            </span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalWeeklyLunchesBooked}</div>
          <span className="text-[11px] text-base-content/60">Total Student Meals Booked</span>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="tabs tabs-boxed bg-base-200 p-1 rounded-2xl font-bold text-xs">
          <button
            onClick={() => setActiveTab("students")}
            className={`tab tab-sm font-bold ${
              activeTab === "students" ? "tab-active bg-secondary text-secondary-content" : ""
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            <span>{t("studentsTab")} ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("chefs")}
            className={`tab tab-sm font-bold ${
              activeTab === "chefs" ? "tab-active bg-secondary text-secondary-content" : ""
            }`}
          >
            <ChefHat className="w-4 h-4 mr-1.5" />
            <span>{t("staffTab")} ({chefs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "students" ? (
            <>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-sm input-bordered w-full sm:w-64 pl-8 text-xs font-medium rounded-xl"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-base-content/50" />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="select select-sm select-bordered text-xs font-bold rounded-xl"
              >
                <option value="all">All Students</option>
                <option value="penalized">Penalized / Blocked Only</option>
                <option value="redflags">Red-Flagged Absentees Only</option>
                <option value="active">Active & Normal Only</option>
              </select>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn btn-sm btn-secondary gap-1 font-bold rounded-xl shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t("addStudent")}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAddChefModal(true)}
              className="btn btn-sm btn-secondary gap-1 font-bold rounded-xl shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("addChef")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "students" ? (
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/80 text-base-content/80 uppercase font-extrabold text-[11px]">
                <tr>
                  <th>Student Info</th>
                  <th>Room</th>
                  <th>
                    <div className="flex items-center gap-1">
                      <span>Weekly Lunch Selections</span>
                      <span className="badge badge-xs badge-ghost text-[9px] font-normal">
                        Click Day to Override
                      </span>
                    </div>
                  </th>
                  <th>Disciplinary & Red-Flag Status</th>
                  <th>Actions & Punishment</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-base-content/60">
                      No matching student records found.
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
                                  onClick={() => adminOverrideStudentLunch(student.id, day)}
                                  title={`Click to toggle ${day.toUpperCase()} lunch for ${student.name}`}
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

                        {/* Status (Penalized / Red-Flagged / Active) */}
                        <td>
                          <div className="flex flex-col gap-1">
                            {student.isPenalized && (
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
                            {!student.isPenalized && !student.isRedFlagged && (
                              <span className="badge badge-success gap-1 text-[10px] font-bold text-success-content py-2">
                                <CheckCircle2 className="w-3 h-3" />
                                Normal & Permitted
                              </span>
                            )}
                            {student.penaltyReason && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                                {student.penaltyReason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Punishment Actions */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            {student.isPenalized ? (
                              <button
                                onClick={() => toggleStudentPenalty(student.id)}
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
                  <th>Action</th>
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
                      <span className="badge badge-success badge-xs font-bold text-success-content">
                        Active Kitchen Staff
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteChef(chef.id)}
                        className="btn btn-xs btn-ghost btn-circle text-error hover:bg-error/10"
                        title="Remove Chef Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

            <div className="py-4 space-y-3 text-xs">
              <p className="text-base-content/80">
                You are imposing a meal modification block on resident:
              </p>
              <div className="p-3 rounded-2xl bg-base-200 font-bold text-sm text-base-content">
                {selectedStudentForBlock.name} ({selectedStudentForBlock.room})
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold">
                  <span>Reason for Disciplinary Penalty</span>
                </label>
                <textarea
                  value={penaltyReasonText}
                  onChange={(e) => setPenaltyReasonText(e.target.value)}
                  className="textarea textarea-bordered w-full text-xs font-medium"
                  rows={3}
                  placeholder="e.g. Failure to comply with dormitory check-in rules..."
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setSelectedStudentForBlock(null)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPenalty}
                className="btn btn-sm btn-error text-white font-bold"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-secondary" />
                <span>Add New Student Resident</span>
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
                <label className="label text-xs font-bold">
                  <span>Student Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Saeed"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="input input-sm input-bordered text-xs font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold">
                  <span>Room Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C-104"
                  value={newStudentRoom}
                  onChange={(e) => setNewStudentRoom(e.target.value)}
                  className="input input-sm input-bordered text-xs font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold">
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. bilal@hostel.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="input input-sm input-bordered text-xs font-medium"
                />
              </div>

              <div className="modal-action pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-secondary font-bold">
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Chef */}
      {showAddChefModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-500" />
                <span>Add Mess Chef Account</span>
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
                <label className="label text-xs font-bold">
                  <span>Chef Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chef Kareem"
                  value={newChefName}
                  onChange={(e) => setNewChefName(e.target.value)}
                  className="input input-sm input-bordered text-xs font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold">
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kareem@hostel.edu"
                  value={newChefEmail}
                  onChange={(e) => setNewChefEmail(e.target.value)}
                  className="input input-sm input-bordered text-xs font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold">
                  <span>Shift Assignment</span>
                </label>
                <select
                  value={newChefShift}
                  onChange={(e) => setNewChefShift(e.target.value)}
                  className="select select-sm select-bordered text-xs font-medium"
                >
                  <option value="Morning & Lunch Session">Morning & Lunch Session</option>
                  <option value="Dinner & Night Session">Dinner & Night Session</option>
                  <option value="All-Day Station Supervisor">All-Day Station Supervisor</option>
                </select>
              </div>

              <div className="modal-action pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddChefModal(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-secondary font-bold">
                  Save Chef
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
