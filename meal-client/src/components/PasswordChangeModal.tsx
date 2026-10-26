"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp } from "@/context/MealAppContext";
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, X, Sparkles } from "lucide-react";

export function PasswordChangeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, language } = useLanguage();
  const { currentUser, changePassword } = useMealApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseDefaultPassword = () => {
    setCurrentPassword("Dorm@1234");
  };

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
    const res = await changePassword(newPassword, currentPassword || undefined);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg("Password changed successfully! Default password is no longer active.");
      setTimeout(() => {
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg(null);
      }, 1600);
    } else {
      setErrorMsg(res.message || "Failed to update password.");
    }
  };

  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-base-content leading-tight">
                Update Account Password
              </h3>
              <span className="text-xs text-base-content/60">
                Secure your meal portal credentials
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentUser?.isPasswordReset && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Default password (<strong className="font-mono font-bold">Dorm@1234</strong>) is currently active.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseDefaultPassword}
                className="btn btn-xs btn-outline border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 w-fit self-end gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-fill Default Password</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error text-xs py-2.5 px-3 rounded-2xl text-white flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success text-xs py-2.5 px-3 rounded-2xl text-white flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-bold text-xs">Current Password</span>
              {currentUser?.isPasswordReset && (
                <span className="label-text-alt text-[11px] text-base-content/60">
                  (Default: Dorm@1234)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={currentUser?.isPasswordReset ? "Enter Dorm@1234" : "Enter current password"}
                className="input input-sm input-bordered w-full pr-10 text-xs font-medium focus:input-primary rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-bold text-xs">New Password</span>
              <span className="label-text-alt text-[10px] text-base-content/50">Min 6 characters</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter strong new password"
              className="input input-sm input-bordered text-xs font-medium focus:input-primary rounded-xl"
            />
          </div>

          {/* Confirm New Password Field */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-bold text-xs">Confirm New Password</span>
              {passwordsMatch && (
                <span className="label-text-alt text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Matches
                </span>
              )}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className={`input input-sm input-bordered text-xs font-medium rounded-xl ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? "input-error"
                  : "focus:input-primary"
              }`}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-sm btn-primary rounded-xl font-bold gap-1.5 shadow-xs"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
