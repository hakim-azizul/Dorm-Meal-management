"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp } from "@/context/MealAppContext";
import {
  Utensils,
  GraduationCap,
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Lock,
  AlertCircle,
  Clock,
  CheckCircle2,
  Coffee,
  SunMedium,
  Moon,
} from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();
  const { isGlobalLocked, isFriday } = useMealApp();

  return (
    <div className="flex flex-col gap-12 py-8 md:py-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-6 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>{t("heroBadge")}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-base-content leading-tight sm:leading-tight mb-6">
          {t("heroTitle")}
        </h1>

        <p className="text-base sm:text-lg text-base-content/70 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t("heroSubtitle")}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard/student"
            className="btn btn-primary btn-md sm:btn-lg gap-2 shadow-lg hover:shadow-primary/30 transition-all font-semibold"
          >
            <GraduationCap className="w-5 h-5" />
            <span>{t("ctaDashboard")}</span>
            <ArrowRight className={`w-4 h-4 ${language === "ar" ? "rotate-180" : ""}`} />
          </Link>

          <Link
            href="/login"
            className="btn btn-outline btn-md sm:btn-lg gap-2 font-semibold"
          >
            <span>{t("ctaLogin")}</span>
          </Link>
        </div>

        {/* Live System Status Ticker */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-base-200/80 border border-base-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base-content/80">Friday Window:</span>
            <span
              className={`badge badge-sm font-bold ${
                isFriday ? "badge-success text-success-content" : "badge-warning"
              }`}
            >
              {isFriday ? "OPEN FOR SELECTION" : "LOCKED (Sat-Thu)"}
            </span>
          </div>
          <div className="w-px h-4 bg-base-300 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base-content/80">Admin Global Lock:</span>
            <span
              className={`badge badge-sm font-bold ${
                isGlobalLocked ? "badge-error text-error-content" : "badge-info text-info-content"
              }`}
            >
              {isGlobalLocked ? "ACTIVATED" : "UNLOCKED"}
            </span>
          </div>
        </div>
      </section>

      {/* 3 Role Portal Interactive Cards */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Portal Card */}
          <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="card-body p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="card-title text-xl font-bold flex items-center justify-between">
                <span>{t("studentPortal")}</span>
                <span className="badge badge-info badge-sm">Role 1</span>
              </h2>
              <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                Breakfast and dinner are fixed and guaranteed. Students view the weekly roster and can customize or opt out of lunches on Fridays.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-base-content/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fixed Breakfast & Dinner (Zero setup)</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/80">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Friday-only lunch customization lock</span>
                </div>
              </div>
            </div>
            <div className="card-actions p-6 pt-0">
              <Link
                href="/dashboard/student"
                className="btn btn-outline btn-primary btn-sm w-full gap-2 font-medium"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className={`w-3.5 h-3.5 ${language === "ar" ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>

          {/* Admin Portal Card */}
          <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="card-body p-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="card-title text-xl font-bold flex items-center justify-between">
                <span>{t("adminPortal")}</span>
                <span className="badge badge-secondary badge-sm">Role 2</span>
              </h2>
              <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                Full authority over the meal scheduling system. Master global lock switch, manage kitchen staff, and impose disciplinary meal blocks.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-base-content/80">
                  <Lock className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Global meal lock / unlock switch</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/80">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Individual student penalty overrides</span>
                </div>
              </div>
            </div>
            <div className="card-actions p-6 pt-0">
              <Link
                href="/dashboard/admin"
                className="btn btn-outline btn-secondary btn-sm w-full gap-2 font-medium"
              >
                <span>Enter Admin Portal</span>
                <ArrowRight className={`w-3.5 h-3.5 ${language === "ar" ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>

          {/* Chef Portal Card */}
          <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="card-body p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <h2 className="card-title text-xl font-bold flex items-center justify-between">
                <span>{t("chefPortal")}</span>
                <span className="badge badge-accent badge-sm">Role 3</span>
              </h2>
              <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                Daily attendance check-ins. Strict pre-selection enforcement (unselected meals cannot be checked in) and dynamic red-flag absence alerts.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-base-content/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Strict pre-selection check-in only</span>
                </div>
                <div className="flex items-center gap-2 text-base-content/80">
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
                  <span>Subsequent days turn red upon absence</span>
                </div>
              </div>
            </div>
            <div className="card-actions p-6 pt-0">
              <Link
                href="/dashboard/chef"
                className="btn btn-outline btn-accent btn-sm w-full gap-2 font-medium"
              >
                <span>Enter Chef Portal</span>
                <ArrowRight className={`w-3.5 h-3.5 ${language === "ar" ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-6">
        <div className="rounded-3xl bg-base-200/50 border border-base-300 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-base-content mb-3">
              Core Architecture & Business Logic
            </h2>
            <p className="text-sm text-base-content/70">
              Designed according to hostel warden regulations, kitchen supply logistics, and anti-waste standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">{t("feature1Title")}</h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                {t("feature1Desc")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">{t("feature2Title")}</h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                {t("feature2Desc")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">{t("feature3Title")}</h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                {t("feature3Desc")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">{t("feature4Title")}</h3>
              <p className="text-xs text-base-content/70 leading-relaxed">
                {t("feature4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
