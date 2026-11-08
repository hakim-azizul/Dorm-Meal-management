"use client";

import React from "react";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
  badgeText?: string;
  colorScheme?: "primary" | "secondary" | "accent" | "error" | "warning" | "success" | "neutral";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  subtext,
  badgeText,
  colorScheme = "primary",
  className = "",
}: StatCardProps) {
  const bgColors = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    error: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    neutral: "bg-base-200 text-base-content",
  };

  const badgeStyles = {
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    error: "badge-error text-white",
    warning: "badge-warning",
    success: "badge-success text-success-content",
    neutral: "badge-ghost",
  };

  return (
    <div
      className={`p-5 rounded-3xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${bgColors[colorScheme]}`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-base-content/70 leading-snug">{title}</span>
        </div>
        {badgeText && (
          <span className={`badge badge-sm font-extrabold ${badgeStyles[colorScheme]}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <span className="text-3xl font-black tracking-tight text-base-content">{value}</span>
        {subtext && <span className="text-[11px] font-semibold text-base-content/50">{subtext}</span>}
      </div>
    </div>
  );
}
