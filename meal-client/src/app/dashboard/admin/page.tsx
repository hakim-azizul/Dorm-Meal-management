"use client";

import React, { useMemo, useState } from "react";
import { useMealApp, type DayKey, type StudentRecord } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { useNotification } from "@/hooks/useNotification";
import { useAdminReport } from "@/hooks/useAdminReport";
import { AdminControlBar } from "@/components/admin/AdminControlBar";
import { ChefsTab } from "@/components/admin/ChefsTab";
import { GlobalLockBanner } from "@/components/admin/GlobalLockBanner";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { StudentsTab } from "@/components/admin/StudentsTab";
import { AddChefModal, type CreateChefInput } from "@/components/admin/modals/AddChefModal";
import { AddStudentModal, type CreateStudentInput } from "@/components/admin/modals/AddStudentModal";
import { BlockStudentModal } from "@/components/admin/modals/BlockStudentModal";
import { ResetPasswordModal } from "@/components/admin/modals/ResetPasswordModal";
import type {
  AdminTab,
  PasswordResetRequest,
  StudentStatusFilter,
} from "@/components/admin/types";

/**
 * Warden portal shell: composes the global lock banner, tabbed control bar,
 * roster/report panels and the administrative dialogs. All business logic is
 * delegated to `MealAppContext`, `useAdminReport` and the mini-components below.
 */
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

  const { notification, notify, notifySuccess, notifyError, clearNotification } =
    useNotification();

  // View state
  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  // Dialog state
  const [studentToBlock, setStudentToBlock] = useState<StudentRecord | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddChefModal, setShowAddChefModal] = useState(false);
  const [userToReset, setUserToReset] = useState<PasswordResetRequest | null>(null);

  // Attendance & meal report (grid preview + A–K CSV export)
  const report = useAdminReport({ isActive: activeTab === "reports", notify });

  const penalizedCount = useMemo(
    () => students.filter((student) => student.isBlocked).length,
    [students],
  );
  const redFlagCount = useMemo(
    () => students.filter((student) => student.isRedFlagged).length,
    [students],
  );

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleSelectStudentFromSidebar = (student: StudentRecord) => {
    setSelectedStudentId(student.id);
    setActiveTab("students");
    setSearchTerm(student.name);
    closeSidebar();
  };

  const handleConfirmBlock = async (reason: string) => {
    if (!studentToBlock) return;
    await toggleStudentPenalty(studentToBlock.id, reason);
    notifySuccess(`Meal restriction set for ${studentToBlock.name}`);
  };

  const handleLiftBlock = async (student: StudentRecord) => {
    await toggleStudentPenalty(student.id);
    notifySuccess(`Meal restriction lifted for ${student.name}`);
  };

  const handleOverrideLunch = async (studentId: string, day: DayKey) => {
    await adminOverrideStudentLunch(studentId, day);
    notifySuccess(`Lunch override updated for ${day.toUpperCase()}`, 2500);
  };

  const handleCreateStudent = async (input: CreateStudentInput) => {
    const result = await addNewStudent(input);
    if (result.success) {
      notifySuccess(`Student ${input.name} created (Password: Dorm@1234)`, 4000);
    } else {
      notifyError(result.message || "Failed to create student", 4000);
    }
    return result;
  };

  const handleCreateChef = async (input: CreateChefInput) => {
    const result = await addNewChef(input);
    if (result.success) {
      notifySuccess(`Chef ${input.name} created (Password: Dorm@1234)`, 4000);
    } else {
      notifyError(result.message || "Failed to create chef", 4000);
    }
    return result;
  };

  const handleConfirmResetPassword = async () => {
    if (!userToReset) return;
    const result = await adminResetPassword(userToReset.id);
    if (result.success) {
      notifySuccess(`Password for ${userToReset.name} reset to "Dorm@1234"`, 4000);
    } else {
      notifyError(result.message, 4000);
    }
  };

  const handleGlobalLockToggle = async () => {
    await toggleGlobalLock();
    notifySuccess(
      !isGlobalLocked
        ? "Global Lock ACTIVATED: All student meal selections are now frozen."
        : "Global Lock DEACTIVATED: Students can now freely update meal selections.",
      3500,
    );
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
      {/* Responsive sidebar with profile & quick student list */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onSelectStudent={handleSelectStudentFromSidebar}
        selectedStudentId={selectedStudentId}
        adminTab={activeTab}
        onAdminTabChange={setActiveTab}
      />

      {/* Main warden dashboard area */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-4">
        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={clearNotification}
          />
        )}

        <GlobalLockBanner isGlobalLocked={isGlobalLocked} onToggle={handleGlobalLockToggle} />

        <AdminControlBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          studentCount={students.length}
          chefCount={chefs.length}
          penalizedCount={penalizedCount}
          redFlagCount={redFlagCount}
          onAddStudent={() => setShowAddStudentModal(true)}
          onAddChef={() => setShowAddChefModal(true)}
          onDownloadCsv={report.exportCsv}
          canDownloadCsv={report.gridRows.length > 0}
        />

        {activeTab === "students" && (
          <StudentsTab
            students={students}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedStudentId={selectedStudentId}
            onOverrideLunch={handleOverrideLunch}
            onOpenBlock={setStudentToBlock}
            onLiftBlock={handleLiftBlock}
            onRequestReset={setUserToReset}
            onDelete={(student) => deleteStudent(student.id)}
          />
        )}

        {activeTab === "chefs" && (
          <ChefsTab
            chefs={chefs}
            onRequestReset={setUserToReset}
            onDeleteChef={deleteChef}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab report={report} onExportCsv={report.exportCsv} />
        )}
      </div>

      {/* Administrative dialogs */}
      {studentToBlock && (
        <BlockStudentModal
          student={studentToBlock}
          onClose={() => setStudentToBlock(null)}
          onConfirm={handleConfirmBlock}
        />
      )}

      {showAddStudentModal && (
        <AddStudentModal
          onClose={() => setShowAddStudentModal(false)}
          onCreate={handleCreateStudent}
        />
      )}

      {showAddChefModal && (
        <AddChefModal onClose={() => setShowAddChefModal(false)} onCreate={handleCreateChef} />
      )}

      {userToReset && (
        <ResetPasswordModal
          user={userToReset}
          onClose={() => setUserToReset(null)}
          onConfirm={handleConfirmResetPassword}
        />
      )}
    </div>
  );
}
