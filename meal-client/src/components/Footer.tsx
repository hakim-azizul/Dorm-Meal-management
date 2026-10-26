"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { UtensilsCrossed } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-base-300 bg-base-200/50 text-base-content py-6 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Branding & automated description */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-base-content block">
                {t("appName")}
              </span>
              <span className="text-xs text-base-content/60 block">
                Automated Hostel Dining & Meal Management System
              </span>
            </div>
          </div>

          {/* Copyright notice */}
          <div className="text-xs text-base-content/50">
            <span>© {new Date().getFullYear()} Hostel Meal Management. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
