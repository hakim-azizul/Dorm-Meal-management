"use client";

import React from "react";
import type { ChefRecord } from "@/context/MealAppContext";
import { ChefAccountRow } from "./ChefAccountRow";
import type { PasswordResetRequest } from "./types";

export interface ChefsTabProps {
  chefs: ChefRecord[];
  onRequestReset: (user: PasswordResetRequest) => void;
  onDeleteChef: (chefId: string) => void;
}

/** Kitchen staff management tab. */
export function ChefsTab({ chefs, onRequestReset, onDeleteChef }: ChefsTabProps) {
  return (
    <div className="space-y-2">
      {chefs.map((chef) => (
        <ChefAccountRow
          key={chef.id}
          chef={chef}
          onRequestReset={onRequestReset}
          onDelete={onDeleteChef}
        />
      ))}

      {chefs.length === 0 && (
        <div className="p-8 rounded-2xl bg-base-100 border border-base-300 text-center text-xs text-base-content/60">
          No chefs currently registered.
        </div>
      )}
    </div>
  );
}
