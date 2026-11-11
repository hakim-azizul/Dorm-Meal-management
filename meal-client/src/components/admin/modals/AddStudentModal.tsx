"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";

export interface CreateStudentInput {
  name: string;
  room: string;
  email: string;
}

export interface AddStudentModalProps {
  onClose: () => void;
  onCreate: (input: CreateStudentInput) => Promise<{ success: boolean; message?: string }>;
}

/** Registration dialog for new hostel residents (default password Dorm@1234). */
export function AddStudentModal({ onClose, onCreate }: AddStudentModalProps) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !room || !email || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const result = await onCreate({ name, room, email });
      if (result.success) {
        onClose();
      } else {
        setError(result.message || "Failed to create student");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box rounded-3xl p-5 max-w-md">
        <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Register Student</span>
        </h3>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3 mt-3">
          <div>
            <label className="text-[11px] font-bold text-base-content/70">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Tariq Mansoor"
              className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/70">Hostel Room</label>
            <input
              type="text"
              required
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              placeholder="e.g. B-204"
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
              placeholder="student@hostel.edu"
              className="input input-sm w-full bg-base-200/60 rounded-xl text-xs mt-1"
            />
          </div>

          <p className="text-[10px] text-base-content/50">
            Default password will be set to <code>Dorm@1234</code>. Student will be prompted to
            change it on first login.
          </p>

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
              Create Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
