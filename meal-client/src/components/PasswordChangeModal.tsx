"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp } from "@/context/MealAppContext";
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export function PasswordChangeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { currentUser, changePassword } = useMealApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    const res = await changePassword(newPassword, currentPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg("Password changed successfully! Default password is no longer active.");
      setTimeout(() => {
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg(null);
      }, 2000);
    } else {
      setErrorMsg(res.message || "Failed to update password.");
    }
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <h3 className="font-bold text-base text-primary flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            <span>Update Account Password</span>
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {currentUser?.isPasswordReset && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You are currently using the default system password (<strong className="font-mono">Dorm@1234</strong>).
                Please set a secure private password.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error text-xs py-2 rounded-xl text-white">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success text-xs py-2 rounded-xl text-white">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-xs">Current Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Default: Dorm@1234"
                className="input input-sm input-bordered w-full pr-10 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-xs">New Password</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input input-sm input-bordered text-xs"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-xs">Confirm New Password</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="input input-sm input-bordered text-xs"
            />
          </div>

          <div className="modal-action border-t border-base-200 pt-3">
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-sm btn-primary font-bold gap-1.5"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
