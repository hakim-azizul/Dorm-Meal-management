"use client";

import React from "react";
import Link from "next/link";

export interface SidebarNavItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  isActive: boolean;
  /** DaisyUI/Tailwind classes applied while the item is active. */
  activeClass: string;
  href?: string;
  onClick?: () => void;
}

/** Single navigation entry used by every role-specific sidebar menu. */
export function SidebarNavItem({
  label,
  icon,
  badge,
  isActive,
  activeClass,
  href,
  onClick,
}: SidebarNavItemProps) {
  const className = `w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs transition-colors ${
    isActive ? activeClass : "text-base-content/80 hover:bg-base-200"
  }`;
  const content = (
    <>
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {badge}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
