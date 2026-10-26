"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useMealApp } from "@/context/MealAppContext";
import {
  UtensilsCrossed,
  Sun,
  Moon,
  Globe,
  GraduationCap,
  ShieldCheck,
  ChefHat,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentRole, currentUser, logout } = useMealApp();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href={
              currentRole === "student"
                ? "/dashboard/student"
                : currentRole === "admin"
                ? "/dashboard/admin"
                : currentRole === "chef"
                ? "/dashboard/chef"
                : "/"
            }
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-base-content">
                {t("appName")}
              </span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                {currentRole ? `${currentRole.toUpperCase()} PORTAL` : "Hostel Dining"}
              </span>
            </div>
          </Link>
        </div>

        {/* Role-Based Dynamic Navigation (Strictly Isolated) */}
        <nav className="hidden md:flex items-center gap-2">
          {currentRole === "student" && (
            <Link
              href="/dashboard/student"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname === "/dashboard/student"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/80 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t("studentPortal")}</span>
            </Link>
          )}

          {currentRole === "admin" && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname === "/dashboard/admin"
                  ? "bg-secondary text-secondary-content shadow-xs"
                  : "text-base-content/80 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t("adminPortal")}</span>
            </Link>
          )}

          {currentRole === "chef" && (
            <Link
              href="/dashboard/chef"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname === "/dashboard/chef"
                  ? "bg-accent text-accent-content shadow-xs"
                  : "text-base-content/80 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>{t("chefPortal")}</span>
            </Link>
          )}

          {!currentRole && (
            <Link
              href="/login"
              className="btn btn-primary btn-sm rounded-xl font-bold gap-2"
            >
              <User className="w-4 h-4" />
              <span>{t("login")}</span>
            </Link>
          )}
        </nav>

        {/* Right Controls: Language, Theme & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle (English & Arabic with dynamic RTL) */}
          <button
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-base-300 hover:bg-base-200 text-xs font-bold transition-colors"
            title="Toggle English / Arabic (RTL)"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-base-300 hover:bg-base-200 text-base-content transition-colors"
            title={theme === "light" ? t("darkMode") : t("lightMode")}
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Current User Pill & Sign Out */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-base-content truncate max-w-32.5">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-base-content/60 capitalize">
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="btn btn-sm btn-ghost btn-circle text-error hover:bg-error/10"
                title={t("logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-sm btn-primary rounded-xl font-bold hidden sm:flex"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-base-300 hover:bg-base-200"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-base-200 bg-base-100 p-4 space-y-3">
          {currentRole === "student" && (
            <Link
              href="/dashboard/student"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t("studentPortal")}</span>
            </Link>
          )}

          {currentRole === "admin" && (
            <Link
              href="/dashboard/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/10 text-secondary font-bold text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t("adminPortal")}</span>
            </Link>
          )}

          {currentRole === "chef" && (
            <Link
              href="/dashboard/chef"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/10 text-accent font-bold text-sm"
            >
              <ChefHat className="w-4 h-4" />
              <span>{t("chefPortal")}</span>
            </Link>
          )}

          {currentUser ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-error/10 text-error font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("logout")}</span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full btn btn-primary btn-sm font-bold"
            >
              {t("login")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

