"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useMealApp, Role } from "@/context/MealAppContext";
import {
  UtensilsCrossed,
  GraduationCap,
  ShieldCheck,
  ChefHat,
  Lock,
  Mail,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const { loginAsRole } = useMealApp();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [email, setEmail] = useState("ahmed@hostel.edu");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === "student") {
      setEmail("ahmed@hostel.edu");
    } else if (role === "admin") {
      setEmail("warden@hostel.edu");
    } else if (role === "chef") {
      setEmail("chef@hostel.edu");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      loginAsRole(selectedRole);
      setIsLoading(false);
      if (selectedRole === "student") {
        router.push("/dashboard/student");
      } else if (selectedRole === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/chef");
      }
    }, 300);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card w-full max-w-lg bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 border-b border-base-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-3 shadow-lg">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-base-content">
            {t("signInTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-md mx-auto">
            {t("signInSubtitle")}
          </p>
        </div>

        <div className="card-body p-6 sm:p-8">
          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-2">
              {t("quickAccess")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleRoleSelect("student")}
                className={`flex sm:flex-col items-center justify-start sm:justify-center p-3 rounded-2xl border text-xs font-bold gap-2 transition-all ${
                  selectedRole === "student"
                    ? "bg-primary text-primary-content border-primary shadow-md"
                    : "border-base-300 hover:bg-base-200 text-base-content/80"
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                <span>{t("roleStudent")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`flex sm:flex-col items-center justify-start sm:justify-center p-3 rounded-2xl border text-xs font-bold gap-2 transition-all ${
                  selectedRole === "admin"
                    ? "bg-secondary text-secondary-content border-secondary shadow-md"
                    : "border-base-300 hover:bg-base-200 text-base-content/80"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{t("roleAdmin")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("chef")}
                className={`flex sm:flex-col items-center justify-start sm:justify-center p-3 rounded-2xl border text-xs font-bold gap-2 transition-all ${
                  selectedRole === "chef"
                    ? "bg-accent text-accent-content border-accent shadow-md"
                    : "border-base-300 hover:bg-base-200 text-base-content/80"
                }`}
              >
                <ChefHat className="w-5 h-5" />
                <span>{t("roleChef")}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label text-xs font-bold text-base-content">
                <span>{t("email")}</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input input-bordered w-full pl-10 text-xs sm:text-sm font-medium"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-base-content/50" />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-base-content">
                <span>{t("password")}</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input input-bordered w-full pl-10 text-xs sm:text-sm font-medium"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-base-content/50" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-base-200/60 border border-base-300 text-xs text-base-content/70 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Role isolation is strictly enforced. You will be directed to the dedicated {selectedRole.toUpperCase()} dashboard.
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full gap-2 font-bold shadow-md hover:shadow-primary/30 transition-all text-sm mt-2"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <span>
                    {t("submitLogin")} ({selectedRole.toUpperCase()})
                  </span>
                  <ArrowRight className={`w-4 h-4 ${language === "ar" ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
