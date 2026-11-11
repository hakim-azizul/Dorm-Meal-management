"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, GraduationCap, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp, type Role, type StudentRecord } from "@/context/MealAppContext";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";
import type { AdminTab } from "@/components/admin/types";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";
import { SidebarNavigation } from "@/components/sidebar/SidebarNavigation";
import {
  SidebarProfileCard,
  type SidebarRoleMeta,
} from "@/components/sidebar/SidebarProfileCard";

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
  adminTab?: AdminTab;
  onAdminTabChange?: (tab: AdminTab) => void;
}

/**
 * Responsive dashboard shell: backdrop, aside container, mobile header and
 * the composed profile / navigation / footer sections.
 */
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
  const { t } = useLanguage();
  const { currentRole, logout } = useMealApp();
  const router = useRouter();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const handleSignOut = () => {
    void logout();
    void router.push("/login");
  };

  const roleMeta: Record<Role, SidebarRoleMeta> = {
    student: {
      title: t("roleStudent"),
      icon: <GraduationCap className="w-5 h-5 text-primary" />,
      badgeClass: "badge-primary",
      bgClass: "bg-primary/10",
    },
    admin: {
      title: t("roleAdmin"),
      icon: (
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      ),
      badgeClass: "bg-emerald-600 text-white font-bold",
      bgClass: "bg-emerald-500/10",
    },
    chef: {
      title: t("roleChef"),
      icon: <ChefHat className="w-5 h-5 text-accent" />,
      badgeClass: "badge-accent",
      bgClass: "bg-accent/10",
    },
  };

  const currentMeta = roleMeta[currentRole || "student"];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 inset-s-0 z-50 w-72 sm:w-80 bg-base-100 border-e border-base-300 flex flex-col justify-between shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0"
        }`}
      >
        {/* Mobile header with close control */}
        <div className="p-4 border-b border-base-200 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentMeta.bgClass}`}
            >
              {currentMeta.icon}
            </div>
            <span className="font-extrabold text-sm">{currentMeta.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content: profile (section 1) + navigation (section 2) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <SidebarProfileCard
            meta={currentMeta}
            onSelectStudent={onSelectStudent}
            selectedStudentId={selectedStudentId}
            onOpenPasswordModal={() => setPasswordModalOpen(true)}
            onSignOut={handleSignOut}
          />

          <SidebarNavigation
            adminTab={adminTab}
            onAdminTabChange={onAdminTabChange}
            chefSession={chefSession}
            onChefSessionChange={onChefSessionChange}
          />
        </div>

        {/* System status & preferences */}
        <SidebarFooter />
      </aside>

      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
