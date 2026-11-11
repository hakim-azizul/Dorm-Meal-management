"use client";

import React from "react";
import { Globe, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { DatabaseStatusBadge } from "@/components/ui/DatabaseStatusBadge";

/** Sidebar footer: live database status plus language and theme quick toggles. */
export function SidebarFooter() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 border-t border-base-200 bg-base-200/40 space-y-2">
      <div className="flex items-center justify-between">
        <DatabaseStatusBadge />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="btn btn-xs btn-ghost btn-circle"
            title={language === "en" ? "العربية" : "English"}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-xs btn-ghost btn-circle"
            title={theme === "light" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-warning" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
