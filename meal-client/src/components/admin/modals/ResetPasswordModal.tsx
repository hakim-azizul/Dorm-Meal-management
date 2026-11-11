"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import type { PasswordResetRequest } from "../types";

export interface ResetPasswordModalProps {
  user: PasswordResetRequest;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/** Confirmation dialog restoring a user's password to the Dorm@1234 default. */
export function ResetPasswordModal({ user, onClose, onConfirm }: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box rounded-3xl p-5 max-w-sm">
        <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>Reset Password</span>
        </h3>
        <p className="text-xs text-base-content/70 mt-2">
          Reset password for <strong>{user.name}</strong> ({user.role}) back to default:{" "}
          <code>Dorm@1234</code>?
        </p>

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
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl text-xs"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
