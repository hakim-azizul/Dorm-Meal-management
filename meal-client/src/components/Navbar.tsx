"use client";

import React from "react";
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
  Menu,
  X,
  LogOut,
} from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentRole, currentUser, logout, isSidebarOpen, toggleSidebar } = useMealApp();
  const pathname = usePathname();
  const router = useRouter();

  // উইন্ডো অবজেক্ট চেক করে সরাসরি মাউন্টেড নির্ধারণ (useEffect এর ঝামেলা নেই)
  const isMounted = typeof window !== "undefined";

  const isDashboardRoute = pathname.startsWith("/dashboard");

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-base-300 bg-base-100/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand / Logo + Mobile Sidebar Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isDashboardRoute && currentUser && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl border border-base-300 hover:bg-base-200 text-base-content focus:outline-hidden"
              aria-label="Toggle Dashboard Menu"
              title="Open Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

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
            className="flex items-center gap-2 transition-transform hover:scale-[1.01]"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-xs">
              <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base tracking-tight text-base-content leading-none">
                {t("appTitle")}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-primary tracking-wider uppercase mt-0.5">
                {t("appSubtitle")}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="btn btn-sm btn-ghost btn-circle"
            title={language === "en" ? "العربية" : "English"}
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-base-content" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-ghost btn-circle"
            title={isMounted && theme === "light" ? "Dark Mode" : "Light Mode"}
            aria-label="Toggle theme"
          >
            {isMounted && theme === "dark" ? (
              <Sun className="w-4 h-4 text-warning" />
            ) : (
              <Moon className="w-4 h-4 text-base-content" />
            )}
          </button>

          {/* Quick Sign Out or Sign In */}
          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="btn btn-sm btn-ghost btn-circle text-error/80 hover:text-error hover:bg-error/10"
              title={t("logout")}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-sm btn-primary rounded-xl font-bold text-xs"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}