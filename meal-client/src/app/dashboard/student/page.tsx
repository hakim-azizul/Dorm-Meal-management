"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp, DayKey } from "@/context/MealAppContext";
import {
  GraduationCap,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  Sun,
  Moon,
  Clock,
  ShieldAlert,
  Info,
  CalendarDays,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function StudentDashboard() {
  const { t } = useLanguage();
  const {
    currentUser,
    studentSchedule,
    toggleStudentLunch,
    isGlobalLocked,
    isFriday,
    systemDay,
    toggleFridaySimulation,
    todayDateFormatted,
    isHydrated,
  } = useMealApp();

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLunchCheckboxChange = async (day: DayKey) => {
    setIsUpdating(true);
    try {
      const res = await toggleStudentLunch(day);
      if (res.success) {
        setNotification({ type: "success", text: res.message });
      } else {
        setNotification({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update lunch selection" });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const selectedLunchesCount = studentSchedule.filter((d) => d.lunch.selected).length;
  const isStudentBlocked = currentUser?.isBlocked;
  const isCanModifyLunch = isFriday && !isGlobalLocked && !isStudentBlocked;

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <span className="text-xs font-semibold text-base-content/60">Loading resident session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      {/* Student Profile Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-base-200/60 border border-base-300 mb-8 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-base-content">
                {currentUser?.name || "Ahmed Al-Mansoor"}
              </h1>
              {isStudentBlocked ? (
                <span className="badge badge-error gap-1 text-xs font-bold py-2.5 px-3 text-white">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Meal Selection Suspended
                </span>
              ) : currentUser?.isRedFlagged ? (
                <span className="badge badge-error gap-1 text-xs font-bold py-2.5 px-3 text-white animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Red-Flag Active
                </span>
              ) : (
                <span className="badge badge-success gap-1 text-xs font-bold py-2.5 px-3 text-success-content">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Resident
                </span>
              )}

              {/* Database Connection Indicator */}
              <span
                className="badge badge-xs font-bold gap-1 py-2 px-2.5 badge-success badge-outline text-emerald-600"
                title="Connected to MongoDB Atlas Database"
              >
                <Wifi className="w-3 h-3" />
                <span>Database Online</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              {t("room")}: <strong className="text-base-content">{currentUser?.room || "A-204"}</strong> • {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Operating Window Status & Quick Friday Simulator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-base-100 border border-base-300 text-xs shadow-xs">
            <div className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
              Current System Time
            </div>
            <div className="font-extrabold text-sm text-primary flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="w-4 h-4" />
              <span>{todayDateFormatted}</span>
            </div>
          </div>

          {/* Dev-Only Friday Simulation Toggle */}
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={toggleFridaySimulation}
              className={`btn btn-sm gap-2 font-bold transition-all border shadow-xs ${
                isFriday
                  ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                  : "bg-base-100 text-base-content border-base-300 hover:bg-base-200"
              }`}
              title="Dev Mode: Toggle between Friday (window open) and Monday (window closed)"
            >
              <span className="badge badge-xs badge-warning uppercase font-mono font-bold text-[9px]">Dev</span>
              <Clock className="w-4 h-4" />
              <span>
                {isFriday ? t("simulateOtherDay") : t("simulateFriday")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* REAL-TIME WARNING BANNER 1: Disciplinary Punishment / Admin Block */}
      {isStudentBlocked && (
        <div className="alert alert-error mb-6 shadow-md border border-rose-300">
          <ShieldAlert className="w-6 h-6 shrink-0 text-white" />
          <div className="text-white">
            <h3 className="font-bold text-sm sm:text-base">
              {t("punishmentAlertTitle")}
            </h3>
            <p className="text-xs sm:text-sm mt-0.5 opacity-90">
              {t("punishmentAlertMsg")}
            </p>
            {currentUser?.penaltyReason && (
              <div className="mt-1.5 text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-lg w-fit">
                Notice: {currentUser.penaltyReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL-TIME WARNING BANNER 2: Red-Flagged Attendance Status */}
      {currentUser?.isRedFlagged && (
        <div className="alert alert-error mb-6 shadow-md border border-rose-400 bg-rose-600 text-white">
          <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              {t("redFlagAlertTitle")}
            </h3>
            <p className="text-xs sm:text-sm mt-0.5 opacity-95">
              {t("redFlagAlertMsg")}
            </p>
          </div>
        </div>
      )}

      {/* REAL-TIME WARNING BANNER 3: Admin Global Lock */}
      {isGlobalLocked && (
        <div className="alert alert-warning mb-6 shadow-md border border-amber-300">
          <Lock className="w-6 h-6 shrink-0 text-amber-900" />
          <div>
            <h3 className="font-bold text-sm sm:text-base">{t("globalLockAlertTitle")}</h3>
            <p className="text-xs sm:text-sm mt-0.5 text-amber-900">
              {t("globalLockAlertMsg")}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Notification Alert */}
      {notification && (
        <div
          className={`alert mb-6 shadow-md transition-all ${
            notification.type === "success"
              ? "alert-success text-success-content"
              : "alert-error text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{notification.text}</span>
        </div>
      )}

      {/* Policy Instruction Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-base-100 border border-base-300 mb-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-base-content/80">
            {t("fridayPolicyNote")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`badge font-extrabold text-xs py-3 px-3 ${
              isCanModifyLunch
                ? "badge-success text-success-content"
                : "badge-error text-white"
            }`}
          >
            {isCanModifyLunch
              ? t("fridayOpenBadge")
              : t("fridayLockedBadge")}
          </span>
          <span className="text-xs font-bold text-base-content/60">
            ({selectedLunchesCount}/7 Lunches Selected)
          </span>
        </div>
      </div>

      {/* Interactive Weekly Meal Grid (Saturday through Friday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {studentSchedule.map((dayItem) => {
          const dayKey = dayItem.day;
          const isLunchSelected = dayItem.lunch.selected;
          const isToday = systemDay === dayKey;
          const isMissedRedFlagDay = currentUser?.isRedFlagged && isLunchSelected;

          return (
            <div
              key={dayKey}
              className={`card bg-base-100 border transition-all duration-200 overflow-hidden ${
                isToday
                  ? "ring-2 ring-primary border-primary shadow-md"
                  : "border-base-300 hover:border-base-400"
              }`}
            >
              {/* Day Header Banner */}
              <div
                className={`p-3 text-center border-b font-extrabold text-sm flex items-center justify-between ${
                  isToday
                    ? "bg-primary text-primary-content"
                    : "bg-base-200/80 text-base-content border-base-300"
                }`}
              >
                <span>{t(dayKey)}</span>
                {isToday && (
                  <span className="badge badge-xs bg-white text-primary font-black uppercase text-[9px]">
                    Today
                  </span>
                )}
              </div>

              <div className="card-body p-4 flex flex-col justify-between gap-4">
                {/* 1. BREAKFAST: Fixed / Auto-Selected Daily */}
                <div className="p-3 rounded-2xl bg-base-200/50 border border-base-200">
                  <div className="flex items-center justify-between text-xs font-bold text-base-content/80 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      {t("breakfast")}
                    </span>
                    <span className="badge badge-xs badge-success text-[10px] text-success-content font-bold">
                      {t("fixedBadge")}
                    </span>
                  </div>
                  <p className="text-[11px] text-base-content/70 line-clamp-2 leading-relaxed">
                    {dayItem.breakfast.name}
                  </p>
                </div>

                {/* 2. LUNCH: Selection Policy (ONLY editable on Fridays) */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    isMissedRedFlagDay
                      ? "bg-rose-500/10 border-rose-500/40"
                      : isLunchSelected
                      ? "bg-primary/5 border-primary/30"
                      : "bg-base-200/30 border-base-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-base-content">
                      <Sun className="w-3.5 h-3.5 text-orange-500" />
                      {t("lunch")}
                    </span>
                    <span
                      className={`badge badge-xs font-bold text-[10px] ${
                        isMissedRedFlagDay
                          ? "badge-error text-white"
                          : isLunchSelected
                          ? "badge-primary"
                          : "badge-ghost"
                      }`}
                    >
                      {isMissedRedFlagDay
                        ? "Tagged Red"
                        : isLunchSelected
                        ? t("preSelected")
                        : t("optedOut")}
                    </span>
                  </div>

                  <p className="text-[11px] text-base-content/70 mb-3 leading-relaxed">
                    {isLunchSelected
                      ? dayItem.lunch.menuItem
                      : "Opted out. No kitchen portion scheduled."}
                  </p>

                  {/* Interactive Checkbox Control (ONLY enabled on Friday) */}
                  <label
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      !isCanModifyLunch || isUpdating
                        ? "bg-base-200/60 border-base-300 opacity-70 cursor-not-allowed"
                        : isLunchSelected
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-base-100 border-base-300 hover:bg-base-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isLunchSelected}
                        disabled={!isCanModifyLunch || isUpdating}
                        onChange={() => handleLunchCheckboxChange(dayKey)}
                        className={`checkbox checkbox-sm ${
                          isLunchSelected ? "checkbox-primary" : "checkbox-neutral"
                        }`}
                      />
                      <span className="text-xs font-bold select-none">
                        {isLunchSelected ? "Lunch Included" : "No Lunch"}
                      </span>
                    </div>

                    {!isCanModifyLunch && (
                      <Lock className="w-3.5 h-3.5 text-base-content/50" />
                    )}
                  </label>

                  {!isCanModifyLunch && (
                    <div className="text-[10px] text-base-content/50 mt-1.5 text-center flex items-center justify-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Friday Only</span>
                    </div>
                  )}
                </div>

                {/* 3. DINNER: Fixed / Auto-Selected Daily */}
                <div className="p-3 rounded-2xl bg-base-200/50 border border-base-200">
                  <div className="flex items-center justify-between text-xs font-bold text-base-content/80 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      {t("dinner")}
                    </span>
                    <span className="badge badge-xs badge-success text-[10px] text-success-content font-bold">
                      {t("fixedBadge")}
                    </span>
                  </div>
                  <p className="text-[11px] text-base-content/70 line-clamp-2 leading-relaxed">
                    {dayItem.dinner.name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
