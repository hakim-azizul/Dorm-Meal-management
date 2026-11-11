"use client";

import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { StudentRecord } from "@/context/MealAppContext";

const DEFAULT_REASON = "Hostel noise complaint or mess policy violation";

export interface BlockStudentModalProps {
  student: StudentRecord;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

/** Administrative confirmation dialog for suspending a student's meal privileges. */
export function BlockStudentModal({ student, onClose, onConfirm }: BlockStudentModalProps) {
  const [reason, setReason] = useState(student.penaltyReason || DEFAULT_REASON);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box rounded-3xl p-5 max-w-sm">
        <h3 className="font-extrabold text-base text-error flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          <span>Suspend Meal Privileges</span>
        </h3>
        <p className="text-xs text-base-content/70 mt-1">
          Student: <strong>{student.name}</strong> ({student.room})
        </p>

        <div className="mt-3 space-y-2">
          <label className="text-[11px] font-bold text-base-content/70">
            Administrative Reason
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Specify violation..."
            rows={3}
            className="textarea textarea-sm w-full bg-base-200/60 rounded-xl text-xs"
          />
        </div>

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
            className="btn btn-sm btn-error text-white rounded-xl text-xs font-bold"
          >
            Confirm Block
          </button>
        </div>
      </div>
    </div>
  );
}
