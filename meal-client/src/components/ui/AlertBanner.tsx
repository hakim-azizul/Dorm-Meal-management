"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface AlertBannerProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function AlertBanner({
  type,
  message,
  title,
  icon,
  onClose,
  className = "",
}: AlertBannerProps) {
  const typeStyles = {
    success: "alert-success text-success-content",
    error: "alert-error text-white",
    warning: "alert-warning text-amber-900",
    info: "alert-info text-info-content",
  };

  const defaultIcons = {
    success: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
    info: <Info className="w-5 h-5 shrink-0" />,
  };

  return (
    <div
      className={`alert mb-6 shadow-md transition-all flex items-start sm:items-center justify-between gap-3 rounded-2xl ${typeStyles[type]} ${className}`}
      role="alert"
    >
      <div className="flex items-start sm:items-center gap-3">
        {icon || defaultIcons[type]}
        <div>
          {title && <h3 className="font-bold text-sm sm:text-base leading-tight">{title}</h3>}
          <p className="text-xs sm:text-sm font-semibold opacity-95 mt-0.5">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/10"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
