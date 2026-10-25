"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { UtensilsCrossed, ShieldAlert, Heart } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-base-300 bg-base-200/50 text-base-content py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">{t("appName")}</span>
            <span className="text-xs text-base-content/60">
              — Automated Dining Management
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-base-content/70">
            <Link href="/dashboard/student" className="hover:text-primary transition-colors">
              {t("studentPortal")}
            </Link>
            <Link href="/dashboard/admin" className="hover:text-primary transition-colors">
              {t("adminPortal")}
            </Link>
            <Link href="/dashboard/chef" className="hover:text-primary transition-colors">
              {t("chefPortal")}
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              {t("login")}
            </Link>
          </div>

          <div className="text-xs text-base-content/50 flex items-center gap-1">
            <span>© {new Date().getFullYear()} Hostel Meal Management. Built with Next.js & DaisyUI.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
