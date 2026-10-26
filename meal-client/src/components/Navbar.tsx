"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useMealApp } from "@/context/MealAppContext";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";
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
  KeyRound,
} from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentRole, currentUser, logout } = useMealApp();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

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
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-xs">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-base-content leading-none">
                {t("appTitle")}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-primary tracking-wider uppercase">
                {t("appSubtitle")}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {currentRole === "student" && (
            <Link
              href="/dashboard/student"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pathname === "/dashboard/student"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t("studentPortal")}</span>
            </Link>
          )}

          {currentRole === "admin" && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pathname === "/dashboard/admin"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t("adminPortal")}</span>
            </Link>
          )}

          {currentRole === "chef" && (
            <Link
              href="/dashboard/chef"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pathname === "/dashboard/chef"
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-200"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>{t("chefPortal")}</span>
            </Link>
          )}
        </nav>

        {/* Right Actions: Theme, Lang, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="btn btn-sm btn-ghost btn-circle"
            title={language === "en" ? "التحويل إلى العربية" : "Switch to English"}
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-base-content" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-ghost btn-circle"
            title={theme === "light" ? "Dark mode" : "Light mode"}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-base-content" />
            ) : (
              <Sun className="w-4 h-4 text-warning" />
            )}
          </button>

          {/* User Profile / Password / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-base-content truncate max-w-32.5">
                  {currentUser.name}
                </span>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-base-content/60 capitalize">
                    {currentUser.role}
                  </span>
                  {currentUser.isPasswordReset && (
                    <span className="badge badge-warning badge-xs text-[9px] font-bold">
                      Default Pass
                    </span>
                  )}
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="btn btn-sm btn-ghost btn-circle text-primary hover:bg-primary/10"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>

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
            <div className="space-y-2 pt-2 border-t border-base-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>

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
            </div>
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

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}
