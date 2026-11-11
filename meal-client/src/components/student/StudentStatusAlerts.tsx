"use client";

import React from "react";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import { AlertBanner } from "@/components/ui/AlertBanner";

export interface StudentStatusAlertsProps {
  isBlocked: boolean;
  penaltyReason?: string;
  isRedFlagged: boolean;
  isGlobalLocked: boolean;
}

/** Renders the disciplinary / lock warning banners for the resident portal (only when active). */
export function StudentStatusAlerts({
  isBlocked,
  penaltyReason,
  isRedFlagged,
  isGlobalLocked,
}: StudentStatusAlertsProps) {
  return (
    <>
      {isBlocked && (
        <AlertBanner
          type="error"
          title="Meal Privileges Suspended"
          message={`Privileges suspended: ${penaltyReason || "Administrative hold"}`}
          icon={<ShieldAlert className="w-5 h-5 shrink-0 text-white" />}
        />
      )}

      {isRedFlagged && (
        <AlertBanner
          type="error"
          title="Absence Red Flag"
          message="Unexcused missed lunch. Check in with mess chef on your next meal to clear."
          icon={<AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />}
        />
      )}

      {isGlobalLocked && (
        <AlertBanner
          type="warning"
          title="Global Lock Active"
          message="All meal selections are currently frozen by the administration."
          icon={<Lock className="w-5 h-5 shrink-0 text-amber-900" />}
        />
      )}
    </>
  );
}
