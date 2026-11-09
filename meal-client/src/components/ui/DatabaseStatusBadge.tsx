"use client";

import React from "react";
import { Wifi } from "lucide-react";

export function DatabaseStatusBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`badge badge-xs font-bold gap-1 py-2 px-2.5 badge-success badge-outline text-emerald-600 dark:text-emerald-400 ${className}`}
      title="Directly connected to MongoDB Atlas database"
    >
      <Wifi className="w-3 h-3" />
      <span>Online</span>
    </span>
  );
}
