"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChefHat,
  FileSpreadsheet,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import { useMealApp, type MealType } from "@/context/MealAppContext";
import type { AdminTab } from "@/components/admin/types";
import { SidebarNavItem } from "./SidebarNavItem";

export interface SidebarNavigationProps {
  adminTab?: AdminTab;
  onAdminTabChange?: (tab: AdminTab) => void;
  chefSession?: MealType;
  onChefSessionChange?: (session: MealType) => void;
}

/** Section 2 of the sidebar: role-isolated navigation and the warden's global lock switch. */
export function SidebarNavigation({
  adminTab,
  onAdminTabChange,
  chefSession,
  onChefSessionChange,
}: SidebarNavigationProps) {
  const { currentRole, isGlobalLocked, toggleGlobalLock, students } = useMealApp();
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black text-base-content/50 uppercase tracking-wider px-2">
        Navigation
      </span>

      {/* Resident navigation */}
      {currentRole === "student" && (
        <div className="space-y-1.5">
          <SidebarNavItem
            href="/dashboard/student"
            label="Weekly Meals"
            icon={<Calendar className="w-4 h-4" />}
            isActive={pathname === "/dashboard/student"}
            activeClass="bg-primary text-primary-content shadow-xs"
            badge={
              <span
                className={`badge badge-xs text-[10px] font-bold ${
                  !isGlobalLocked ? "badge-success text-success-content" : "badge-ghost"
                }`}
              >
                {!isGlobalLocked ? "Open" : "Locked"}
              </span>
            }
          />
        </div>
      )}

      {/* Warden navigation & global lock switch */}
      {currentRole === "admin" && (
        <div className="space-y-1.5">
          <SidebarNavItem
            label="Student Roster"
            icon={<Users className="w-4 h-4" />}
            isActive={adminTab === "students"}
            activeClass="bg-emerald-600 text-white shadow-xs"
            onClick={() => onAdminTabChange?.("students")}
            badge={
              <span className="badge badge-sm badge-ghost text-[10px]">{students.length}</span>
            }
          />

          <SidebarNavItem
            label="Kitchen Chefs"
            icon={<ChefHat className="w-4 h-4" />}
            isActive={adminTab === "chefs"}
            activeClass="bg-emerald-600 text-white shadow-xs"
            onClick={() => onAdminTabChange?.("chefs")}
          />

          <SidebarNavItem
            label="Reports & Downloads"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            isActive={adminTab === "reports"}
            activeClass="bg-emerald-600 text-white shadow-xs"
            onClick={() => onAdminTabChange?.("reports")}
            badge={
              <span className="badge badge-sm badge-success text-success-content text-[10px]">
                CSV
              </span>
            }
          />

          <button
            type="button"
            onClick={() => void toggleGlobalLock()}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs border transition-colors mt-2 ${
              isGlobalLocked
                ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <span className="flex items-center gap-2">
              {isGlobalLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>{isGlobalLocked ? "Global Lock Active" : "Global Lock Off"}</span>
            </span>
            <span className="badge badge-xs text-[9px] font-black uppercase">
              {isGlobalLocked ? "Frozen" : "Open"}
            </span>
          </button>
        </div>
      )}

      {/* Chef meal-session navigation */}
      {currentRole === "chef" && (
        <div className="space-y-1.5">
          <SidebarNavItem
            label="Breakfast (Fixed)"
            isActive={chefSession === "breakfast"}
            activeClass="bg-accent text-accent-content shadow-xs"
            onClick={() => onChefSessionChange?.("breakfast")}
            badge={
              <span className="badge badge-sm badge-ghost text-[10px]">All</span>
            }
          />

          <SidebarNavItem
            label="Lunch (Pre-Selected)"
            isActive={chefSession === "lunch"}
            activeClass="bg-accent text-accent-content shadow-xs"
            onClick={() => onChefSessionChange?.("lunch")}
            badge={
              <span className="badge badge-sm badge-warning font-black text-[9px]">
                Gated
              </span>
            }
          />

          <SidebarNavItem
            label="Dinner (Fixed)"
            isActive={chefSession === "dinner"}
            activeClass="bg-accent text-accent-content shadow-xs"
            onClick={() => onChefSessionChange?.("dinner")}
            badge={
              <span className="badge badge-sm badge-ghost text-[10px]">All</span>
            }
          />
        </div>
      )}
    </div>
  );
}
