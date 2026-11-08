"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useMealApp, StudentRecord } from "@/context/MealAppContext";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";
import { DatabaseStatusBadge } from "@/components/ui/DatabaseStatusBadge";
import {
  GraduationCap,
  ShieldCheck,
  ChefHat,
  KeyRound,
  LogOut,
  Calendar,
  Users,
  Sun,
  Moon,
  Globe,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";

export interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional admin student select handler
  onSelectStudent?: (student: StudentRecord) => void;
  selectedStudentId?: string;
  // Optional chef session props
  chefSession?: "breakfast" | "lunch" | "dinner";
  onChefSessionChange?: (session: "breakfast" | "lunch" | "dinner") => void;
  // Optional admin active tab
  adminTab?: "students" | "chefs";
  onAdminTabChange?: (tab: "students" | "chefs") => void;
}

export function DashboardSidebar({
  isOpen,
  onClose,
  onSelectStudent,
  selectedStudentId,
  chefSession,
  onChefSessionChange,
  adminTab,
  onAdminTabChange,
}: DashboardSidebarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const {
    currentRole,
    currentUser,
    logout,
    isGlobalLocked,
    toggleGlobalLock,
    isFriday,
    students,
  } = useMealApp();
  const pathname = usePathname();
  const router = useRouter();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [sidebarStudentSearch, setSidebarStudentSearch] = useState("");

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  // Filter students for admin quick sidebar list
  const sidebarFilteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(sidebarStudentSearch.toLowerCase()) ||
      s.room.toLowerCase().includes(sidebarStudentSearch.toLowerCase())
  );

  const roleMeta = {
    student: {
      title: t("roleStudent"),
      icon: <GraduationCap className="w-5 h-5 text-primary" />,
      badgeClass: "badge-primary",
      bgClass: "bg-primary/10",
      accentBorder: "border-primary/30",
    },
    admin: {
      title: t("roleAdmin"),
      icon: <ShieldCheck className="w-5 h-5 text-secondary" />,
      badgeClass: "badge-secondary",
      bgClass: "bg-secondary/10",
      accentBorder: "border-secondary/30",
    },
    chef: {
      title: t("roleChef"),
      icon: <ChefHat className="w-5 h-5 text-accent" />,
      badgeClass: "badge-accent",
      bgClass: "bg-accent/10",
      accentBorder: "border-accent/30",
    },
  };

  const currentMeta = roleMeta[currentRole || "student"];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 start-0 z-50 w-72 sm:w-80 bg-base-100 border-e border-base-300 flex flex-col justify-between shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0"
        }`}
      >
        {/* Top Header inside sidebar with mobile close */}
        <div className="p-4 border-b border-base-200 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentMeta.bgClass}`}>
              {currentMeta.icon}
            </div>
            <span className="font-extrabold text-sm">{currentMeta.title}</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* ====================================================================
              SECTION 1: USER PROFILE & CREDENTIALS
              ==================================================================== */}
          <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${currentMeta.bgClass}`}
                >
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-base-content truncate">
                    {currentUser?.name || "User"}
                  </h2>
                  <p className="text-[11px] text-base-content/60 truncate">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Role & Specific Details */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-base-300/60">
              <span className={`badge badge-sm font-extrabold ${currentMeta.badgeClass}`}>
                {currentMeta.title}
              </span>

              {currentUser?.room && (
                <span className="badge badge-ghost badge-sm text-[11px] font-semibold">
                  {currentUser.room}
                </span>
              )}

              {currentUser?.shift && (
                <span className="badge badge-ghost badge-sm text-[10px] font-semibold truncate max-w-36">
                  {currentUser.shift}
                </span>
              )}

              {currentUser?.isBlocked && (
                <span className="badge badge-error badge-sm text-white text-[10px] font-bold gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" /> Suspended
                </span>
              )}

              {currentUser?.isRedFlagged && (
                <span className="badge badge-error badge-sm text-white text-[10px] font-bold gap-1 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                </span>
              )}

              {currentUser?.isPasswordReset && (
                <span className="badge badge-warning badge-sm text-[10px] font-bold">
                  Default Pass
                </span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="btn btn-xs btn-outline btn-primary rounded-xl font-bold flex items-center justify-center gap-1.5 py-2 h-auto text-[11px]"
                title="Change account password"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>

              <button
                onClick={handleSignOut}
                className="btn btn-xs btn-outline btn-error rounded-xl font-bold flex items-center justify-center gap-1.5 py-2 h-auto text-[11px]"
                title="Sign out of session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Quick Admin Student List Widget in Section 1 */}
            {currentRole === "admin" && (
              <div className="pt-3 border-t border-base-300/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-base-content/70 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Students ({students.length})
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={sidebarStudentSearch}
                    onChange={(e) => setSidebarStudentSearch(e.target.value)}
                    placeholder="Quick find..."
                    className="input input-xs w-full bg-base-100 rounded-lg text-xs ps-7 pe-2 border-base-300"
                  />
                  <Search className="w-3 h-3 text-base-content/40 absolute start-2 top-2" />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 pe-1">
                  {sidebarFilteredStudents.slice(0, 15).map((stu) => {
                    const isSelected = selectedStudentId === stu.id;
                    return (
                      <button
                        key={stu.id}
                        onClick={() => onSelectStudent?.(stu)}
                        className={`w-full text-start p-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-secondary text-secondary-content font-bold"
                            : "hover:bg-base-300/60 text-base-content"
                        }`}
                      >
                        <span className="truncate max-w-36">{stu.name}</span>
                        <div className="flex items-center gap-1">
                          {stu.isBlocked ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Blocked" />
                          ) : stu.isRedFlagged ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Red Flag" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                          )}
                          <span className="text-[10px] opacity-70">{stu.room}</span>
                        </div>
                      </button>
                    );
                  })}
                  {sidebarFilteredStudents.length === 0 && (
                    <div className="text-[11px] text-base-content/50 text-center py-2">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====================================================================
              SECTION 2: NAVIGATION & OPERATIONS
              ==================================================================== */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-base-content/50 uppercase tracking-wider px-2">
              Navigation
            </span>

            {/* Student Navigation Items */}
            {currentRole === "student" && (
              <div className="space-y-1.5">
                <Link
                  href="/dashboard/student"
                  className={`flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    pathname === "/dashboard/student"
                      ? "bg-primary text-primary-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Weekly Meals</span>
                  </span>
                  <span
                    className={`badge badge-xs text-[10px] font-bold ${
                      isFriday
                        ? "badge-success text-success-content"
                        : "badge-ghost"
                    }`}
                  >
                    {isFriday ? "Friday Open" : "Locked"}
                  </span>
                </Link>
              </div>
            )}

            {/* Admin Navigation & Controls */}
            {currentRole === "admin" && (
              <div className="space-y-1.5">
                <button
                  onClick={() => onAdminTabChange?.("students")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    adminTab === "students"
                      ? "bg-secondary text-secondary-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Student Roster</span>
                  </span>
                  <span className="badge badge-sm badge-ghost text-[10px]">
                    {students.length}
                  </span>
                </button>

                <button
                  onClick={() => onAdminTabChange?.("chefs")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    adminTab === "chefs"
                      ? "bg-secondary text-secondary-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    <span>Kitchen Chefs</span>
                  </span>
                </button>

                {/* Global Selection Lock Toggle directly in sidebar */}
                <button
                  onClick={toggleGlobalLock}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs border transition-colors mt-2 ${
                    isGlobalLocked
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isGlobalLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>{isGlobalLocked ? "Global Lock Active" : "Global Lock Off"}</span>
                  </span>
                  <span className="badge badge-xs text-[9px] font-black uppercase">
                    {isGlobalLocked ? "Frozen" : "Open"}
                  </span>
                </button>
              </div>
            )}

            {/* Chef Navigation Items (Meal Sessions) */}
            {currentRole === "chef" && (
              <div className="space-y-1.5">
                <button
                  onClick={() => onChefSessionChange?.("breakfast")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    chefSession === "breakfast"
                      ? "bg-accent text-accent-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span>Breakfast (Fixed)</span>
                  <span className="badge badge-sm badge-ghost text-[10px]">All</span>
                </button>

                <button
                  onClick={() => onChefSessionChange?.("lunch")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    chefSession === "lunch"
                      ? "bg-accent text-accent-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span>Lunch (Pre-Selected)</span>
                  <span className="badge badge-sm badge-warning font-black text-[9px]">Gated</span>
                </button>

                <button
                  onClick={() => onChefSessionChange?.("dinner")}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
                    chefSession === "dinner"
                      ? "bg-accent text-accent-content shadow-xs"
                      : "text-base-content/80 hover:bg-base-200"
                  }`}
                >
                  <span>Dinner (Fixed)</span>
                  <span className="badge badge-sm badge-ghost text-[10px]">All</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            SIDEBAR FOOTER: SYSTEM STATUS & PREFERENCES
            ==================================================================== */}
        <div className="p-4 border-t border-base-200 bg-base-200/40 space-y-2">
          <div className="flex items-center justify-between">
            <DatabaseStatusBadge />

            {/* Theme & Language Quick Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                className="btn btn-xs btn-ghost btn-circle"
                title={language === "en" ? "العربية" : "English"}
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleTheme}
                className="btn btn-xs btn-ghost btn-circle"
                title={theme === "light" ? "Dark Mode" : "Light Mode"}
              >
                {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-warning" />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
