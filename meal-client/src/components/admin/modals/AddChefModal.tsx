"use client";

import React, { useState } from "react";
import { ChefHat } from "lucide-react";

export interface CreateChefInput {
  name: string;
  email: string;
  shift: string;
}

export interface AddChefModalProps {
  onClose: () => void;
  onCreate: (input: CreateChefInput) => Promise<{ success: boolean; message?: string }>;
}

/** Registration dialog for kitchen staff (default password Dorm@1234). */
export function AddChefModal({ onClose, onCreate }: AddChefModalProps) {
  const [name, setName] = useState("");
  const [shift, setShift] = useState("Morning & Lunch Session");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const result = await onCreate({ name, email, shift });
      if (result.success) {
        onClose();
      } else {
        setError(result.message || "Failed to create chef");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box rounded-3xl p-5 max-w-md">
        <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Register Mess Chef</span>
        </h3>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3 mt-3">
          <div>
            <label className="text-[11px] font-bold text-base-content/70">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Chef Kareem"
              className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/70">Shift Schedule</label>
            <input
              type="text"
              required
              value={shift}
              onChange={(event) => setShift(event.target.value)}
              placeholder="e.g. Lunch & Dinner Shift"
              className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/70">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="chef@hostel.edu"
              className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
            />
          </div>

          {error && (
            <p className="text-[11px] font-bold text-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-action mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-sm btn-ghost rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs font-bold"
            >
              Create Chef
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
