"use client";

import React from "react";
import { ChefHat, KeyRound, Trash2 } from "lucide-react";
import type { ChefRecord } from "@/context/MealAppContext";
import type { PasswordResetRequest } from "./types";

export interface ChefAccountRowProps {
  chef: ChefRecord;
  onRequestReset: (user: PasswordResetRequest) => void;
  onDelete: (chefId: string) => void;
}

/** Compact account card for the kitchen-chef management list. */
export function ChefAccountRow({ chef, onRequestReset, onDelete }: ChefAccountRowProps) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-base-100 border border-base-300 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-sm flex items-center justify-center shrink-0">
          <ChefHat className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-base-content truncate">{chef.name}</span>
            <span className="badge badge-sm badge-ghost font-semibold text-[10px]">
              {chef.shift}
            </span>
            {chef.isPasswordReset && (
              <span className="badge badge-sm bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                Default Pass
              </span>
            )}
          </div>
          <p className="text-[11px] text-base-content/60 truncate mt-0.5">{chef.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onRequestReset({ id: chef.id, name: chef.name, role: "Chef" })}
          className="btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-base-content"
          title="Reset Password to Dorm@1234"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(chef.id)}
          className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error"
          title="Delete Chef"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
