"use client";

import React, { useState } from "react";
import { useMealApp, type DayKey } from "@/context/MealAppContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { useNotification } from "@/hooks/useNotification";
import { StudentStatusAlerts } from "@/components/student/StudentStatusAlerts";
import { StudentWeekHeader } from "@/components/student/StudentWeekHeader";
import { StudentMealDayCard } from "@/components/student/StudentMealDayCard";

/** Resident portal: 7-day meal grid with daily guaranteed meals and toggleable lunches. */
export default function StudentDashboard() {
  const {
    currentUser,
    studentSchedule,
    toggleStudentLunch,
    isGlobalLocked,
    systemDay,
    isHydrated,
    isSidebarOpen,
    closeSidebar,
  } = useMealApp();

  const { notification, notify, clearNotification } = useNotification();
  const [isUpdating, setIsUpdating] = useState(false);

  const isStudentBlocked = Boolean(currentUser?.isBlocked);
  const isCanModifyLunch = !isGlobalLocked && !isStudentBlocked;
  const selectedLunchesCount = studentSchedule.filter((day) => day.lunch.selected).length;

  const handleLunchCheckboxChange = async (day: DayKey) => {
    if (!isCanModifyLunch || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await toggleStudentLunch(day);
      notify({ type: res.success ? "success" : "error", text: res.message });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update lunch choice";
      notify({ type: "error", text: errorMsg });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-base-100">
      <DashboardSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-4">
        <StudentStatusAlerts
          isBlocked={isStudentBlocked}
          penaltyReason={currentUser?.penaltyReason}
          isRedFlagged={Boolean(currentUser?.isRedFlagged)}
          isGlobalLocked={isGlobalLocked}
        />

        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.text}
            onClose={clearNotification}
          />
        )}

        <StudentWeekHeader
          isCanModifyLunch={isCanModifyLunch}
          isGlobalLocked={isGlobalLocked}
          selectedLunchesCount={selectedLunchesCount}
        />

        {/* Daily meal rows */}
        <div className="space-y-2.5">
          {studentSchedule.map((dayItem) => (
            <StudentMealDayCard
              key={dayItem.day}
              dayItem={dayItem}
              isToday={systemDay === dayItem.day}
              isCanModifyLunch={isCanModifyLunch}
              isUpdating={isUpdating}
              onToggleLunch={handleLunchCheckboxChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
